import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [shake, setShake] = useState(false);
    const navigate = useNavigate();

    const login = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message);
                setShake(true);
                setTimeout(() => setShake(false), 400);
                return;
            }

            localStorage.setItem("token", data.token);
            setMessage("Успешный вход 🚀");
            setTimeout(() => navigate("/profile"), 400);
        } catch {
            setMessage("Ошибка сервера");
        }
    };

    return (
        <div className={`auth-wrapper ${shake ? "shake" : ""}`}>
            <h2 className="auth-title">Вход</h2>

            <input
                className="auth-input"
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

            <button className="auth-button" onClick={login}>
                Войти
            </button>

            {message && <div className="auth-message">{message}</div>}

            <div className="auth-link" onClick={() => navigate("/register")}>
                Нет аккаунта? Зарегистрироваться
            </div>
        </div>
    );
}
