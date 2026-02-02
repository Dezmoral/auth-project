import { Router } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Email уже существует" });
        }

        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (email, password_hash, full_name)
             VALUES ($1, $2, $3)`,
            [email, hash, full_name]
        );

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
        const user = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: "Пользователь не найден" });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.rows[0].password_hash
        );

        if (!validPassword) {
            return res.status(400).json({ message: "Неверный пароль" });
        }

        const token = jwt.sign(
            {
                id: user.rows[0].id,
                email: user.rows[0].email,
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
