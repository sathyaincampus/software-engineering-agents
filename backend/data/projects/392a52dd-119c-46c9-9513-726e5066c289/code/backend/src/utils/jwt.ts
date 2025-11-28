import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateToken = (payload: JwtPayload, secret: string, expiresIn: string = '1h'): string => {
    return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = async (token: string, secret: string): Promise<JwtPayload | null> => {
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return decoded;
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return null;
    }
};

export default {
    generateToken,
    verifyToken,
};
