import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [shake, setShake] = useState(false);
    const navigate = useNavigate();

    const register = async () => {
        if (!fullName || !email || !password) {
            setMessage("Заполните все поля");
            setShake(true);
            setTimeout(() => setShake(false), 400);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message);
                setShake(true);
                setTimeout(() => setShake(false), 400);
                return;
            }

            setMessage("Регистрация успешна 🎉");
            setTimeout(() => navigate("/login"), 1200); // редирект на login
        } catch {
            setMessage("Ошибка сервера");
            setShake(true);
            setTimeout(() => setShake(false), 400);
        }
    };

    return (
        <div className={`auth-wrapper ${shake ? "shake" : ""}`}>
            <h2 className="auth-title">Регистрация</h2>

            <input
                className="auth-input"
                placeholder="Полное имя"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
            />

            <input
                className="auth-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                className="auth-input"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button className="auth-button" onClick={register}>
                Создать аккаунт
            </button>

            {message && <div className="auth-message">{message}</div>}

            <div className="auth-link" onClick={() => navigate("/login")}>
                Уже есть аккаунт? Войти
            </div>
        </div>
    );
}
