import { useContext, createContext, useState, useEffect } from "react";
import { API_URL } from "./constants";
const AuthContext = createContext({
    isAuthenticated: false,
    getAccessToken:() => {},
    saveUser: () => {},
    getRefreshToken:() => {},
    getUser: () => ({}),
    signOut:() => {},
});

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState("");
    const [isLoading,setIsloading] =useState(true);
    const [user, setUser] = useState(null);

   useEffect(() => {
    checkAuth();

    }, []);

    async function requestNewAccessToken(refreshToken) {
    try {
        const response = await fetch(`${API_URL}/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${refreshToken}`,
            },
            });

        if (response.ok) {
            const json = await response.json();
            if(json.error){
                throw new Error("No se pudo renovar el access token");
            }
            return json.body.accessToken;
        } else{
            throw new Error(response.statusText);
        }
    } catch (error) {
        console.error("❌ Error al solicitar nuevo access token:", error);
        return null;
    }
    }
    //el hhttp
    async function getUserInfo(accessToken) {
    try {
        const response = await fetch(`${API_URL}/user`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const json = await response.json();
            if(json.error){
                throw new Error(json.error);
            }
            return json.body;
        } else {
            throw new Error("No se pudo obtener la información del usuario");
        }
    } catch (error) {
        console.error("❌ Error al obtener info del usuario:", error);
        return null;
    }
}


    async function checkAuth() {
       if(accessToken){
        //el usuario esta autenticado
        const userInfo = await getUserInfo(accessToken);
        if(userInfo){
                    saveSessionInfo(userInfo,accessToken,getRefreshToken());
                    setIsloading(false);
                    return;
                }
       }else{
        //el usuario no esta autenticado
        const token= getRefreshToken();
        if(token){
            const newaccesstoken = await requestNewAccessToken(token);
            if(newaccesstoken){
                const userInfo = await getUserInfo(newaccesstoken);
                if(userInfo){
                    saveSessionInfo(userInfo,newaccesstoken,token);
                    setIsloading(false);
                    return;
                }

            }
        }

       }setIsloading(false);
    }
     
    function signOut(){
        setIsAuthenticated(false);
        setAccessToken("");
        setUser(undefined);
        localStorage.removeItem("token");
    }



    function saveSessionInfo(userInfo, accessToken, refreshToken) {
    setAccessToken(accessToken);
    //setRefreshToken(refreshToken);
    localStorage.setItem("token", JSON.stringify(refreshToken));
    setIsAuthenticated(true);
    setUser(userInfo);
    console.log("💾 Sesión guardada:");
    }
    function getAccessToken() {
        //console.log("🔑 getAccessToken llamado, token:", accessToken);
        return accessToken;
    }
    function getRefreshToken() {
    const tokenDATA = localStorage.getItem("token");
    if (tokenDATA) {
        const token = JSON.parse(tokenDATA);
        return token;
    }
    return null; // ⬅️ Agregar return por si no hay token
    }



    function saveUser(userData){
      //  console.log("🔵  provider saveUser llamado con:", userData);
        //console.log("📦  provider accessToken recibido:", userData.body.accesstoken);
        //console.log("📦  provider refreshToken recibido:", userData.body.refreshtoken);

        saveSessionInfo(
            userData.body.user,
            userData.body.accessToken,
            userData.body.refreshToken,

        );
        //console.log("✅ Usuario autenticado, isAuthenticated:", true);
    }
    function getUser(){
        return user;
    }
    // Debug: Ver cuando cambia isAuthenticated
    

    return (
        <AuthContext.Provider value={
            { isAuthenticated, 
            getAccessToken, 
            saveUser ,
            getRefreshToken,
            getUser,
            signOut,
            }}>
            {isLoading ? <div> Loading ....</div> : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
