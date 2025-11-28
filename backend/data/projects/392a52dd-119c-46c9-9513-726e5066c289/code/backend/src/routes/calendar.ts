import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Event, EventCategory } from '@prisma/client';
import { jwt as jwtUtils } from '../utils';
import { z } from 'zod'; 
import { Server, Socket } from 'socket.io'; 
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { RRule } from 'rrule'; 

const router = express.Router();
const prisma = new PrismaClient();

// --- Interfaces and Types ---

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: string;
    };
}

const eventInputSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    description: z.string().optional(),
    startTime: z.string().datetime(), 
    endTime: z.string().datetime(),   
    location: z.string().optional(),
    assignedToId: z.string().uuid().nullable().optional(), 
    eventCategoryId: z.string().uuid().nullable().optional(),
    // Recurrence fields
    isRecurring: z.boolean().default(false),
    recurrenceRule: z.string().optional(), // Store as RRule string
    recurringEndDate: z.string().optional(), 
});

const categoryInputSchema = z.object({
    name: z.string().min(1, { message: 'Category name is required' }),
    color: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, { message: 'Invalid hex color code' }),
});

type ServerIo = Server<any, any, any, Record<string, any>>;

// --- Middleware ---

const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing token.' });
};

const isEventOwnerOrFamilyMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const currentUserId = req.user.userId;

    try {
        const event = await prisma.event.findUnique({
            where: {
                eventId: eventId,
            },
            select: {
                createdById: true,
                familyId: true, 
            },
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        if (event.createdById === currentUserId) {
            return next();
        }
        
        // Placeholder for family member check. Requires proper family context management.
        return res.status(403).json({ message: 'Forbidden: You do not own this event.' });

    } catch (error) {
        console.error('Authorization check error:', error);
        res.status(500).json({ message: 'Internal server error during authorization.' });
    }
};

// --- Helper Functions ---

const generateRecurringEvents = (event: Event, startDate: Date, endDate: Date): Event[] => {
    if (!event.isRecurring || !event.recurrenceRule) {
        return [];
    }

    try {
        const rule = RRule.parseString(event.recurrenceRule);
        
        const occurrences = rule.between(startDate, endDate, true);

        return occurrences.map(occurrenceDate => {
            const eventStartTime = new Date(occurrenceDate);
            eventStartTime.setHours(
                new Date(event.startTime).getHours(),
                new Date(event.startTime).getMinutes()
            );
            const eventEndTime = new Date(occurrenceDate);
            eventEndTime.setHours(
                new Date(event.endTime).getHours(),
                new Date(event.endTime).getMinutes()
            );

            return {
                ...event, 
                eventId: `${event.eventId}_${occurrenceDate.toISOString().split('T')[0]}`, 
                startTime: eventStartTime,
                endTime: eventEndTime,
                originalEventId: event.eventId, 
                isRecurring: false, 
                recurrenceRule: null, 
                recurringEndDate: null, 
            };
        });

    } catch (error) {
        console.error(`Error generating recurrence for event ${event.eventId}:`, error);
        return [];
    }
};

// --- API Routes ---

// GET /api/v1/users/me/events - Get events relevant to the current user's family context
router.get('/users/me/events', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;
    const { startDate: queryStartDate, endDate: queryEndDate } = req.query;

    try {
        let whereClause: any = {};

        if (currentUserRole === prisma.UserRole.CHILD) {
            whereClause = {
                OR: [
                    { assignedToId: currentUserId },
                    { createdById: currentUserId } 
                ],
            };
        } else if (currentUserRole === prisma.UserRole.PARENT) {
             whereClause = {
                 OR: [
                    { createdById: currentUserId },
                    { assignedTo: { parentId: currentUserId } },
                 ]
             }
        }
        
        const startBound = queryStartDate && typeof queryStartDate === 'string' ? new Date(queryStartDate) : undefined;
        const endBound = queryEndDate && typeof queryEndDate === 'string' ? new Date(queryEndDate) : undefined;

        if (startBound) {
            whereClause.startTime = { ...whereClause.startTime, gte: startBound.toISOString() };
        }
        if (endBound) {
            whereClause.endTime = { ...whereClause.endTime, lte: endBound.toISOString() };
        }

        const baseEvents = await prisma.event.findMany({
            where: whereClause,
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } },
                createdBy: { select: { userId: true, displayName: true } },
                category: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        let allEvents = [...baseEvents];
        if (endBound && startBound) { 
            baseEvents.forEach(event => {
                if (event.isRecurring && event.recurrenceRule) {
                    const recurringInstances = generateRecurringEvents(event, startBound, endBound);
                    allEvents = allEvents.concat(recurringInstances);
                }
            });
        }

        res.status(200).json(allEvents);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/calendar/events - Create a new event
router.post('/events', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const creatorId = req.user.userId;
    const { title, description, startTime, endTime, location, assignedToId, eventCategoryId, isRecurring, recurrenceRule, recurringEndDate } = req.body;

    const validationResult = eventInputSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validationResult.error.errors });
    }

    const validatedData = validationResult.data;

    try {
        const familyId = creatorId; // Placeholder
        
        if (validatedData.assignedToId) {
            const assignedUser = await prisma.user.findUnique({ where: { userId: validatedData.assignedToId }});
            if (!assignedUser) {
                return res.status(404).json({ message: 'Assigned user not found.' });
            }
        }

        if (validatedData.eventCategoryId) {
            const category = await prisma.eventCategory.findUnique({ where: { categoryId: validatedData.eventCategoryId }});
            if (!category) {
                return res.status(404).json({ message: 'Event category not found.' });
            }
        }

        const newEvent = await prisma.event.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                startTime: new Date(validatedData.startTime),
                endTime: new Date(validatedData.endTime),
                location: validatedData.location,
                assignedToId: validatedData.assignedToId,
                eventCategoryId: validatedData.eventCategoryId,
                createdById: creatorId,
                familyId: familyId, 
                isRecurring: validatedData.isRecurring || false,
                recurrenceRule: validatedData.isRecurring ? validatedData.recurrenceRule : null,
                recurringEndDate: validatedData.isRecurring ? validatedData.recurringEndDate : null,
            },
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } },
                createdBy: { select: { userId: true, displayName: true } },
                category: true,
            }
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/v1/calendar/events/:eventId - Update an existing event
router.put('/events/:eventId', authenticateJWT, isEventOwnerOrFamilyMember, async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params;
    const { title, description, startTime, endTime, location, assignedToId, eventCategoryId, isRecurring, recurrenceRule, recurringEndDate } = req.body;

    const validationResult = eventInputSchema.partial().safeParse(req.body); 
    if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validationResult.error.errors });
    }
    const validatedData = validationResult.data;

    try {
        if (validatedData.assignedToId) {
            const assignedUser = await prisma.user.findUnique({ where: { userId: validatedData.assignedToId }});
            if (!assignedUser) {
                return res.status(404).json({ message: 'Assigned user not found.' });
            }
        }

        if (validatedData.eventCategoryId) {
            const category = await prisma.eventCategory.findUnique({ where: { categoryId: validatedData.eventCategoryId }});
            if (!category) {
                return res.status(404).json({ message: 'Event category not found.' });
            }
        }

        const updatedEvent = await prisma.event.update({
            where: {
                eventId: eventId,
            },
            data: {
                title: validatedData.title,
                description: validatedData.description,
                startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
                endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
                location: validatedData.location,
                assignedToId: validatedData.assignedToId,
                eventCategoryId: validatedData.eventCategoryId,
                isRecurring: validatedData.isRecurring,
                recurrenceRule: validatedData.isRecurring ? validatedData.recurrenceRule : null,
                recurringEndDate: validatedData.isRecurring ? validatedData.recurringEndDate : null,
                updatedAt: new Date(),
            },
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } },
                createdBy: { select: { userId: true, displayName: true } },
                category: true,
            }
        });

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error(`Error updating event ${eventId}:`, error);
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Event not found.' });
        }
         if (error.code === 'P2003') { 
             return res.status(404).json({ message: 'Invalid assigned user ID or category ID.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/v1/calendar/events/:eventId - Delete an event
router.delete('/events/:eventId', authenticateJWT, isEventOwnerOrFamilyMember, async (req: AuthenticatedRequest, res: Response) => {
    const { eventId } = req.params;

    try {
        const deletedEvent = await prisma.event.delete({
            where: {
                eventId: eventId,
            },
            select: {
                eventId: true,
                familyId: true,
            }
        });

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error);
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Event not found.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- Category Routes ---

// POST /api/v1/calendar/categories - Create a new event category
router.post('/categories', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const creatorId = req.user.userId;
    const { name, color } = req.body;

    const validationResult = categoryInputSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validationResult.error.errors });
    }
    const validatedData = validationResult.data;

    try {
        const familyId = creatorId; // Placeholder
        
        const existingCategory = await prisma.eventCategory.findFirst({
            where: {
                name: validatedData.name,
                familyId: familyId,
            }
        });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category with this name already exists in your family.' });
        }

        const newCategory = await prisma.eventCategory.create({
            data: {
                name: validatedData.name,
                color: validatedData.color,
                familyId: familyId, 
            },
        });

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating event category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/v1/calendar/categories - Get event categories for the user's family
router.get('/categories', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user.userId;
    try {
        const familyId = currentUserId; // Placeholder

        const categories = await prisma.eventCategory.findMany({
            where: {
                familyId: familyId, 
            },
            orderBy: {
                name: 'asc',
            }
        });

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching event categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/v1/calendar/categories/:categoryId - Update an event category
router.put('/categories/:categoryId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { categoryId } = req.params;
    const { name, color } = req.body;
    const currentUserId = req.user.userId;

    const validationResult = categoryInputSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid input', errors: validationResult.error.errors });
    }
    const validatedData = validationResult.data;

    try {
         const category = await prisma.eventCategory.findUnique({ where: { categoryId } });
         if (!category) {
             return res.status(404).json({ message: 'Category not found.' });
         }
        // Placeholder ownership check

        const updatedCategory = await prisma.eventCategory.update({
            where: {
                categoryId: categoryId,
            },
            data: {
                name: validatedData.name,
                color: validatedData.color,
            }
        });
        
        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error(`Error updating category ${categoryId}:`, error);
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/v1/calendar/categories/:categoryId - Delete an event category
router.delete('/categories/:categoryId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { categoryId } = req.params;
    const currentUserId = req.user.userId;

    try {
         const category = await prisma.eventCategory.findUnique({ where: { categoryId } });
         if (!category) {
             return res.status(404).json({ message: 'Category not found.' });
         }
        // Placeholder ownership check

        await prisma.event.updateMany({
            where: { eventCategoryId: categoryId },
            data: { eventCategoryId: null },
        });

        await prisma.eventCategory.delete({
            where: {
                categoryId: categoryId,
            },
        });

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(`Error deleting category ${categoryId}:`, error);
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
