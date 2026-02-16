import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/register", async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ message: "Заполните все поля" });
    }

    if (!email.includes("@")) {
        return res.status(400).json({ message: "Некорректный email" });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email уже существует" });
        }

        const hash = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                passwordHash: hash,
                fullName: full_name,
            },
        });

        res.json({ message: "Регистрация прошла успешно" });
    } catch (e) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Проверка заполненности
    if (!email || !password) {
        return res.status(400).json({ message: "Введите email и пароль" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({ message: "Пользователь не найден" });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!validPassword) {
            return res.status(400).json({ message: "Неверный пароль" });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

export default router;
