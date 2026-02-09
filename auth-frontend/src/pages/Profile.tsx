import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = {
    id: number;
    email: string;
    role: string;
};

export default function Profile() {
    const [user, setUser] = useState<User | null>(null);
    const [adminMessage, setAdminMessage] = useState<string>("");
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                const res = await fetch("http://localhost:5000/api/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Ошибка при загрузке профиля");
                }
                setUser(data.user);
            } catch (e: any) {
                setError(e.message || "Ошибка");
            }
        })();
    }, [token, navigate]);

    const checkAdmin = async () => {
        setAdminMessage("");
        setError("");
        try {
            const res = await fetch("http://localhost:5000/api/admin", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Доступ запрещён");
            }
            setAdminMessage(data.message);
        } catch (e: any) {
            setError(e.message || "Ошибка");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div style={{ maxWidth: 560, margin: "48px auto", padding: 24 }}>
            <h2>Профиль</h2>
            {!user && !error && <div>Загрузка...</div>}
            {error && (
                <div style={{ color: "#c0392b", marginBottom: 12 }}>Ошибка: {error}</div>
            )}
            {user && (
                <div style={{ marginBottom: 16 }}>
                    <div><b>ID:</b> {user.id}</div>
                    <div><b>Email:</b> {user.email}</div>
                    <div><b>Роль:</b> {user.role}</div>
                </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
                <button onClick={checkAdmin}>Проверить доступ администратора</button>
                <button onClick={logout}>Выйти</button>
            </div>

            {adminMessage && (
                <div style={{ color: "#27ae60", marginTop: 12 }}>{adminMessage}</div>
            )}
        </div>
    );
}
