import express, { Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { jwt as jwtUtils } from '../utils'; 

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

// --- Google OAuth Strategy Configuration ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    scope: ['profile', 'email'], 
}, async (
    accessToken: string,
    refreshToken: string,
    profile: any, 
    done: (error: any, user?: any) => void
) => {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email) {
        return done(new Error('Google email not provided.'), false);
    }

    try {
        let user = await prisma.user.findUnique({ where: { googleId: googleId } });

        if (!user) {
            user = await prisma.user.findUnique({ where: { email: email } });

            if (user && !user.googleId) {
                user = await prisma.user.update({
                    where: { userId: user.userId },
                    data: {
                        googleId: googleId,
                        displayName: displayName || user.displayName,
                        avatarUrl: avatarUrl || user.avatarUrl,
                    },
                });
            }
            else if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: email,
                        googleId: googleId,
                        displayName: displayName,
                        avatarUrl: avatarUrl,
                        role: prisma.UserRole.CHILD, 
                    },
                });
            }
        }

        const token = jwtUtils.generateToken(
            { userId: user.userId, email: user.email, role: user.role },
            process.env.JWT_SECRET as string
        );

        return done(null, { user, token });

    } catch (error) {
        console.error('Error during Google OAuth callback:', error);
        return done(error);
    }
}));

// --- Routes ---

// GET /api/v1/auth/google
router.get('/google', (
    req: Request, 
    res: Response,
    next: Function 
) => {
    const state = Buffer.from(JSON.stringify({ originalUrl: req.query.redirect_url || '/' })).toString('base64');
    passport.authenticate('google', { scope: ['profile', 'email'], state: state })(req, res, next);
});

// GET /api/v1/auth/google/callback
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL + '/login?error=google_auth_failed',
        session: false, 
    }),
    (req: Request, res: Response) => {
        const { token } = req.user as { user: any; token: string };
        let redirectUrl = process.env.FRONTEND_URL + '/dashboard'; 
        if (req.query.state) {
            try {
                const stateData = JSON.parse(Buffer.from(req.query.state.toString(), 'base64').toString());
                if (stateData.originalUrl) {
                    redirectUrl = process.env.FRONTEND_URL + stateData.originalUrl;
                }
            } catch (e) {
                console.error('Failed to parse state parameter:', e);
            }
        }
        res.redirect(`${redirectUrl}?token=${token}`);
    }
);

// POST /api/v1/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
        return res.status(400).json({ message: 'Email, password, and displayName are required.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const passwordHash = 'hashed_password_placeholder'; // Replace with actual hashing

        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                displayName,
                role: prisma.UserRole.CHILD, 
            },
        });

        const token = jwtUtils.generateToken(
            { userId: newUser.userId, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET as string
        );

        res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                userId: newUser.userId,
                email: newUser.email,
                displayName: newUser.displayName,
                role: newUser.role,
            },
        });

    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = true; // Placeholder for actual password check

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwtUtils.generateToken(
            { userId: user.userId, email: user.email, role: user.role },
            process.env.JWT_SECRET as string
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                userId: user.userId,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
