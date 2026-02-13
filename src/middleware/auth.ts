import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type JWTPayload = {
    id: number;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
};

// Extracts and verifies JWT, attaches user payload to req
export function auth(req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers["authorization"]; // e.g., Bearer <token>
        if (!authHeader || Array.isArray(authHeader)) {
            return res.status(401).json({ message: "Токен не предоставлен" });
        }

        const [scheme, token] = authHeader.split(" ");
        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({ message: "Неверный формат токена" });
        }

        const secret = process.env.JWT_SECRET as string;
        if (!secret) {
            return res.status(500).json({ message: "JWT секрет не настроен" });
        }

        const decoded = jwt.verify(token, secret) as JWTPayload;
        req.user = decoded;
        next();
    } catch (e: any) {
        if (e?.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Срок действия токена истёк" });
        }
        return res.status(401).json({ message: "Неверный токен" });
    }
}

// Generic role checker: use after auth
export function requireRole(role: string) {
    return (req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Неавторизовано" });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Доступ запрещён: требуется роль " + role });
        }
        next();
    };
}

// Ensures the authenticated user has admin role
export function requireAdmin(req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: "Неавторизовано" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Доступ запрещён: требуется роль администратора" });
    }

    next();
}
