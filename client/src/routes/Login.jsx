import DefaultLayout from "../layout/defaultlayout";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { API_URL } from "../auth/constants";
import "../routes_css/login.css";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorResponse ,seterrorResponse] = useState("");
    const auth = useAuth();
    const goTo = useNavigate();

    async function handleSubmit(e) {
            e.preventDefault();
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        password,
                    }),
                });
                if (response.ok) {
                    console.log("Login successfully");
                    seterrorResponse("");
                    const json = await response.json();
                    //console.log("📦 Respuesta completa:", json);
                    //console.log("📦 json.body:", json.body);
                    //console.log("🔑 accessToken:", json.body?.accesstoken);
                    //console.log("🔄 refreshToken:", json.body?.refreshtoken);

                    if(json.body.accessToken && json.body.refreshToken){
                        auth.saveUser(json);//ACTUALIZA ESTADO,GUARDE TOKEN
                        goTo("/dashboard");//REDIRIGA DAHSBOARD

                    }
                    
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
    
    if (auth.isAuthenticated){
        return <Navigate to="/dashboard"/>
    }
    return (
     <DefaultLayout>
        <div className="signup-container">
    <form className="form" onSubmit={handleSubmit}>
    <h1>Inicio de sesion</h1>
    {errorResponse && <div className="error-message">{errorResponse}</div>}
    <label>Usuario</label>
    <input 
        type="text" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
    />
    
    <label>Contraseña</label>
    <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
    />

    <button>Login</button>
    <div className="login-link">
                        <p>¿Ya tienes cuenta? <Link to="/signup">Registrate</Link></p>
                    </div>
</form>


     </div>
     </DefaultLayout>
    
    
    );
}