import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer'; 
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const router = express.Router();
const prisma = new PrismaClient();

// --- AWS S3 Configuration ---
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME as string;

// --- Multer Configuration for file uploads ---
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\//)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Interface for JWT payload and authenticated request
interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: string;
    };
}

// GET /api/v1/users/me - Get current user profile
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: {
                userId: userId,
            },
            select: {
                userId: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                parent: {
                    select: {
                        userId: true,
                        displayName: true
                    }
                },
                ...(req.user.role === prisma.UserRole.PARENT && {
                    children: {
                        select: {
                            userId: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    }
                })
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/users/me/avatar - Upload and update user avatar
router.post('/me/avatar', upload.single('avatar'), async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Avatar file is required.' });
    }

    const userId = req.user.userId;
    const file = req.file;
    const fileName = `avatars/${userId}/${Date.now()}${path.extname(file.originalname)}`;

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', 
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        
        const avatarUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        const updatedUser = await prisma.user.update({
            where: {
                userId: userId,
            },
            data: {
                avatarUrl: avatarUrl,
                updatedAt: new Date(),
            },
            select: { avatarUrl: true }, 
        });

        res.status(200).json({
            message: 'Avatar uploaded successfully',
            avatarUrl: updatedUser.avatarUrl,
        });

    } catch (error) {
        console.error('Error uploading avatar to S3:', error);
        res.status(500).json({ message: 'Failed to upload avatar.' });
    }
});

// PUT /api/v1/users/me - Update user profile (displayName, role, parentId)
router.put('/me', async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.userId;
    const { displayName, role, parentId } = req.body;

    if (displayName === undefined && role === undefined && parentId === undefined) {
        return res.status(400).json({ message: 'No update fields provided. Provide displayName, role, or parentId.' });
    }

    const validRoles = Object.values(prisma.UserRole);
    if (role !== undefined && !validRoles.includes(role as prisma.UserRole)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (parentId === userId) {
        return res.status(400).json({ message: 'User cannot be their own parent.' });
    }

    try {
        if (parentId !== undefined) {
            const parentUser = await prisma.user.findUnique({ where: { userId: parentId } });
            if (!parentUser) {
                return res.status(404).json({ message: 'Parent user not found.' });
            }
            if (parentUser.role !== prisma.UserRole.PARENT) {
                 return res.status(400).json({ message: 'The specified parentId does not belong to a PARENT user.' });
            }
        }

        const updateData: any = {};
        if (displayName !== undefined) {
            updateData.displayName = displayName;
        }
        if (role !== undefined) {
            updateData.role = role as prisma.UserRole;
        }
        if (parentId !== undefined) {
            updateData.parentId = parentId;
        }
        updateData.updatedAt = new Date();

        const updatedUser = await prisma.user.update({
            where: {
                userId: userId,
            },
            data: updateData,
            select: {
                userId: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                parentId: true,
                parent: {
                    select: {
                        userId: true,
                        displayName: true
                    }
                }
            },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.code === 'P2003') { 
            return res.status(404).json({ message: 'Invalid parentId provided or relationship error.' });
        }
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'User not found for update.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/users/children - Create a child user (only callable by a PARENT)
router.post('/children', async (req: AuthenticatedRequest, res: Response) => {
    const { displayName, email } = req.body;
    const parentId = req.user.userId;

    if (req.user.role !== prisma.UserRole.PARENT) {
        return res.status(403).json({ message: 'Only parents can create child accounts.' });
    }

    if (!displayName || !email) {
        return res.status(400).json({ message: 'displayName and email are required for creating a child account.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const newChild = await prisma.user.create({
            data: {
                email,
                displayName,
                role: prisma.UserRole.CHILD, 
                parentId: parentId,
            },
            select: {
                userId: true,
                email: true,
                displayName: true,
                role: true,
                parentId: true,
            }
        });

        res.status(201).json(newChild);

    } catch (error) {
        console.error('Error creating child user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/v1/users/children - List all children of the current parent
router.get('/children', async (req: AuthenticatedRequest, res: Response) => {
    if (req.user.role !== prisma.UserRole.PARENT) {
        return res.status(403).json({ message: 'Only parents can view their children.' });
    }

    try {
        const parentId = req.user.userId;
        const children = await prisma.user.findMany({
            where: {
                parentId: parentId,
                role: prisma.UserRole.CHILD, 
            },
            select: {
                userId: true,
                displayName: true,
                avatarUrl: true,
                email: true, 
            },
            orderBy: { displayName: 'asc' },
        });

        res.status(200).json(children);
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/v1/users/children/:childId - Remove a child from the parent's account
router.delete('/children/:childId', async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user.userId;
    const { childId } = req.params;

    if (req.user.role !== prisma.UserRole.PARENT) {
        return res.status(403).json({ message: 'Only parents can remove children.' });
    }

    if (!childId) {
        return res.status(400).json({ message: 'Child ID is required.' });
    }
    
    const isParent = await isParentOfChild(parentId, childId);
    if (!isParent) {
        return res.status(403).json({ message: 'You are not authorized to remove this child.' });
    }

    try {
        await prisma.user.update({
            where: {
                userId: childId,
            },
            data: {
                parentId: null,
            },
        });

        res.status(200).json({ message: `Child account ${childId} unlinked successfully.` });
    } catch (error) {
        console.error(`Error unlinking child ${childId}:`, error);
        if (error.code === 'P2025') { 
             return res.status(404).json({ message: 'Child user not found.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
