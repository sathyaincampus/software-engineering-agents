import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Family from '../models/Family';
import FamilyMember from '../models/FamilyMember';
import UserAuth from '../models/UserAuth';

// Augment the Express Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        familyId?: string;
      };
    }
  }
}

// Middleware to protect routes - verifies JWT token
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Consider adding logic here to check for tokens in cookies if using web clients

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string; familyId?: string };

    // Attach user info to the request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      familyId: decoded.familyId
    };

    // Optionally, fetch user from DB to ensure they still exist and are active
    const user = await User.findByPk(decoded.userId, {
        // Include family info if needed for role checks or context, but token should suffice for auth
        include: [
            { model: FamilyMember, as: 'familyMembers', include: [{ model: Family, as: 'family', attributes: ['family_id'] }] },
        ]
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found, invalid token.' });
    }
    
    // Ensure familyId from token matches user's current family association if available
    let currentFamilyId: string | undefined;
    if (user.familyMembers && user.familyMembers.length > 0 && user.familyMembers[0].family) {
        currentFamilyId = user.familyMembers[0].family.family_id;
    }
    // If familyId is missing in token or mismatched, update from user profile if available
    if (!req.user.familyId && currentFamilyId) {
        req.user.familyId = currentFamilyId;
    } else if (req.user.familyId && currentFamilyId && req.user.familyId !== currentFamilyId) {
        // This case indicates a potential issue (e.g., token familyId is stale)
        // Consider logging a warning or handling appropriately.
        console.warn(`Family ID mismatch in token (${req.user.familyId}) vs user profile (${currentFamilyId}) for user ${decoded.userId}`);
        // Optionally update token's familyId to the current one if that's the desired behavior
        // req.user.familyId = currentFamilyId; 
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware to authorize roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authorization failed: User not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role '${req.user.role}' is not authorized to access this route.` });
    }
    next();
  };
};
