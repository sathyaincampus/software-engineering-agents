import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { jwt as jwtUtils } from '../utils';

const router = express.Router();
const prisma = new PrismaClient();

// Interface for JWT payload and authenticated request
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: string;
    };
}

// --- Middleware to verify JWT and attach user info ---
const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid or missing token.' });
};

// --- Helper to check if user is parent of the child ---
const isParentOfChild = async (parentId: string, childId: string): Promise<boolean> => {
    try {
        const child = await prisma.user.findUnique({
            where: {
                userId: childId,
            },
            select: {
                parentId: true,
            }
        });
        return child?.parentId === parentId;
    } catch (error) {
        console.error(`Error checking parent relationship for user ${childId}:`, error);
        return false;
    }
}

// --- Routes ---

// POST /api/v1/tasks - Create a new task
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, dueDate, points, assignedToId } = req.body;
    const creatorId = req.user.userId;

    if (req.user.role !== prisma.UserRole.PARENT) {
        return res.status(403).json({ message: 'Only parents can create tasks.' });
    }
    if (!title || !assignedToId) {
        return res.status(400).json({ message: 'Title and assignedToId are required.' });
    }

    try {
        const isParent = await isParentOfChild(creatorId, assignedToId);
        if (!isParent) {
            if (creatorId !== assignedToId) {
                 return res.status(403).json({ message: 'You can only assign tasks to your own children or yourself.' });
            }
        }

        const familyId = creatorId; // Placeholder

        const newTask = await prisma.task.create({
            data: {
                title,
                description: description || '',
                dueDate: dueDate || undefined,
                points: points || 0,
                assignedToId,
                createdById: creatorId,
                familyId: familyId, 
                status: prisma.TaskStatus.PENDING, 
            },
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } }, 
            }
        });

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        if (error.code === 'P2003') { 
            return res.status(404).json({ message: 'Invalid assigned user ID.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/v1/tasks - Get tasks
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { status, assignedToId, createdById, familyId, assignedToMe } = req.query;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    try {
        const whereClause: any = {};

        if (status && typeof status === 'string') {
            whereClause.status = status.toUpperCase();
        }
        if (assignedToId && typeof assignedToId === 'string') {
            whereClause.assignedToId = assignedToId;
        }
        if (createdById && typeof createdById === 'string') {
            whereClause.createdById = createdById;
        }
        if (familyId && typeof familyId === 'string') {
             whereClause.familyId = familyId;
        }

        if (currentUserRole === prisma.UserRole.CHILD) {
            if (assignedToId && assignedToId !== currentUserId) {
                return res.status(403).json({ message: 'Children can only view tasks assigned to them.' });
            }
            whereClause.assignedToId = currentUserId; 
        }
        
        if (currentUserRole === prisma.UserRole.PARENT) {
            if (assignedToMe === 'true') {
                whereClause.assignedToId = currentUserId;
            }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } },
                createdBy: { select: { userId: true, displayName: true } }, 
            },
            orderBy: {
                dueDate: 'asc', 
            },
        });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/v1/tasks/:taskId - Get a specific task by ID
router.get('/:taskId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    try {
        const task = await prisma.task.findUnique({
            where: {
                taskId: taskId,
            },
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } },
                createdBy: { select: { userId: true, displayName: true } }, 
            }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        const isAssignedToUser = task.assignedToId === currentUserId;
        const isCreatedByParentOfUser = task.createdById === currentUserId && currentUserRole === prisma.UserRole.PARENT;
        let isChildTaskAccessibleByParent = false;
        if (currentUserRole === prisma.UserRole.PARENT && task.assignedToId) {
            isChildTaskAccessibleByParent = await isParentOfChild(currentUserId, task.assignedToId);
        }

        if (!isAssignedToUser && !isCreatedByParentOfUser && !isChildTaskAccessibleByParent) {
             if (currentUserRole === prisma.UserRole.CHILD && task.createdById !== currentUserId) { 
             }
             if (!isAssignedToUser && !isChildTaskAccessibleByParent) {
                 return res.status(403).json({ message: 'You do not have permission to view this task.' });
             }
        }

        res.status(200).json(task);
    } catch (error) {
        console.error(`Error fetching task ${taskId}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/v1/tasks/:taskId - Update a task
router.put('/:taskId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    const { title, description, dueDate, points, status, assignedToId } = req.body;
    const currentUserId = req.user.userId;
    const currentUserRole = req.user.role;

    try {
        const task = await prisma.task.findUnique({ where: { taskId } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        if (task.createdById !== currentUserId && currentUserRole !== prisma.UserRole.PARENT) {
             if (task.assignedToId === currentUserId && (status !== undefined)) { 
             } else {
                return res.status(403).json({ message: 'You can only update tasks created by you or assigned to you (for status changes).' });
             }
        }
        
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (points !== undefined) updateData.points = points;
        if (status !== undefined) {
            if (!Object.values(prisma.TaskStatus).includes(status as prisma.TaskStatus)) {
                return res.status(400).json({ message: `Invalid status. Must be one of: ${Object.values(prisma.TaskStatus).join(', ')}` });
            }
            updateData.status = status as prisma.TaskStatus;
        }
        if (assignedToId !== undefined) {
            if (currentUserRole === prisma.UserRole.PARENT) {
                 const isParentOfAssignee = await isParentOfChild(currentUserId, assignedToId);
                 if (!isParentOfAssignee && currentUserId !== assignedToId) {
                     return res.status(400).json({ message: 'Invalid assignedToId. Must be a child or the parent.' });
                 }
                 updateData.assignedToId = assignedToId;
            } else if (task.assignedToId !== currentUserId) { 
            } else if (currentUserRole === prisma.UserRole.CHILD && assignedToId !== currentUserId) {
                 return res.status(403).json({ message: 'Children can only assign tasks to themselves.' });
            }
            updateData.assignedToId = assignedToId;
        }
        updateData.updatedAt = new Date();

        const updatedTask = await prisma.task.update({
            where: { taskId },
            data: updateData,
            include: {
                assignedTo: { select: { userId: true, displayName: true, avatarUrl: true } },
                createdBy: { select: { userId: true, displayName: true } },
            }
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error(`Error updating task ${taskId}:`, error);
         if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Task not found.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/v1/tasks/:taskId - Delete a task
router.delete('/:taskId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    const currentUserId = req.user.userId;

    try {
        const task = await prisma.task.findUnique({ where: { taskId } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        if (task.createdById !== currentUserId) {
            return res.status(403).json({ message: 'You can only delete tasks created by you.' });
        }

        await prisma.task.delete({
            where: { taskId },
        });

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(`Error deleting task ${taskId}:`, error);
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Task not found.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
