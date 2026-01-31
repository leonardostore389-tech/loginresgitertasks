import { useState } from "react";
import DefaultLayout from "../layout/defaultlayout";
import { useAuth } from "../auth/AuthProvider";
import { Navigate, useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import "../routes_css/signup.css";
import { Link } from 'react-router-dom';

export default function Signup() {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorResponse ,seterrorResponse] = useState("");

    const auth = useAuth();
    const goTo = useNavigate();
    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    username,
                    password,
                }),
            });
            if (response.ok) {
                console.log("User created successfully");
                seterrorResponse("");

                goTo("/");
            }else{
                console.log("Something wrong");
                const json = await response.json();
                console.log("Response completa:", json); // ✅ Agregar esto
                console.log("Error específico:", json.body.error); // ✅ Agregar esto
                seterrorResponse(json.body.error);
                return;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    if (auth.isAuthenticated) {
        return <Navigate to="/dashboard" />
    }

    return (
        <DefaultLayout fullWidth={true}>
    <div className="signup-container">
        <div className="signup-form-wrapper">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h1>Registrate</h1>
                {errorResponse && <div className="error-message">{errorResponse}</div>}
                
                <label>Nombe</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label>Nombre de Usuario</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                
                <label>Contraseña</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Registrate</button>
                
                <div className="login-link">
                    <p>¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link></p>
                </div>
            </form>
        </div>
    </div>
</DefaultLayout>
    );
}