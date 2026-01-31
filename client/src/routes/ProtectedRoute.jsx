
import { Outlet,Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute(){
    //si el usuario esta identificadion
    // const {isAuth , setIsAuth} =useState(false);
    const auth = useAuth();

    return auth.isAuthenticated ? <Outlet /> : <Navigate to="/" />;
}