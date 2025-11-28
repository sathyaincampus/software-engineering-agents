const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Assuming you have a db connection setup
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/v1/auth/signup - User Signup with Email/Password
router.post('/signup', [
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    body('displayName', 'Display name is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    try {
        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await db.query(
            'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, display_name, role',
            [email, hashedPassword, displayName, 'child'] // Default role is 'child' as per schema
        );

        // Generate JWT
        const payload = {
            user: {
                id: newUser.rows[0].user_id
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    message: 'User created successfully',
                    token,
                    user: {
                        id: newUser.rows[0].user_id,
                        email: newUser.rows[0].email,
                        displayName: newUser.rows[0].display_name,
                        role: newUser.rows[0].role
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/v1/auth/login - User Login with Email/Password
router.post('/login', [
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user.user_id
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.user_id,
                        email: user.email,
                        displayName: user.display_name,
                        role: user.role
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/v1/auth/google - Google Sign-In
router.post('/google', async (req, res) => {
    const { token: googleToken } = req.body;

    if (!googleToken) {
        return res.status(400).json({ message: 'Google token is required' });
    }

    try {
        const ticket = await googleAuthClient.verifyIdToken({
            idToken: googleToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, sub: googleId, name: displayName } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Could not extract email from Google token' });
        }

        // Check if user already exists with this Google ID or email
        let user = null;
        const userByGoogleId = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        if (userByGoogleId.rows.length > 0) {
            user = userByGoogleId.rows[0];
        } else {
            const userByEmail = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userByEmail.rows.length > 0) {
                // User exists by email but not Google ID, update with Google ID
                user = userByEmail.rows[0];
                await db.query('UPDATE users SET google_id = $1 WHERE user_id = $2', [googleId, user.user_id]);
            }
        }

        if (!user) {
            // Create new user if they don't exist
            const newUser = await db.query(
                'INSERT INTO users (email, google_id, display_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, display_name, role',
                [email, googleId, displayName, 'child'] // Default role is 'child'
            );
            user = newUser.rows[0];
        }

        // Generate JWT
        const jwtPayload = {
            user: {
                id: user.user_id
            }
        };

        jwt.sign(
            jwtPayload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    message: 'Google Sign-In successful',
                    token,
                    user: {
                        id: user.user_id,
                        email: user.email,
                        displayName: user.display_name,
                        role: user.role
                    }
                });
            }
        );

    } catch (err) {
        console.error('Google Sign-In Error:', err.message);
        res.status(500).json({ message: 'Google Sign-In failed' });
    }
});

module.exports = router;
