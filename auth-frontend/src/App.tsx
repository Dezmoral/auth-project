import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
    const token = localStorage.getItem("token");

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/profile"
                element={
                    token ? <h2>Вы вошли в систему</h2> : <Navigate to="/login" />
                }
            />
        </Routes>
    );
}

export default App;
