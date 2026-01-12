import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    adminId: number;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            admin?: JwtPayload;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkilendirme başlığı eksik' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
};

// Optional auth - doesn't fail if no token, but attaches admin if valid
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
            req.admin = decoded;
        } catch (error) {
            // Invalid token, but we don't fail - just don't attach admin
        }
    }

    next();
};
