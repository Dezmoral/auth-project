import { Router, Request, Response } from "express";
import { auth, requireAdmin, JWTPayload } from "../middleware/auth";

const router = Router();

// Доступно любому авторизованному пользователю
router.get("/me", auth, (req: Request & { user?: JWTPayload }, res: Response) => {
    return res.json({ user: req.user });
});

// Доступно только администратору
router.get("/admin", auth, requireAdmin, (_req: Request, res: Response) => {
    return res.json({ message: "Доступ разрешен" });
});

export default router;
