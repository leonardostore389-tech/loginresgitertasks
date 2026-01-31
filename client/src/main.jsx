import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Login from './routes/Login.jsx'
import Signup from './routes/signup.jsx'
import Dashboard from './routes/dashboard.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import Profile from './routes/profile.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
   
  {
    path: "/",
    element: <ProtectedRoute />, //me redirecciona al login
    children :[{
      path: "/dashboard",
    element: <Dashboard />,
       
    },
     {
      path: "/me",
    element: <Profile />,
       
    }
  ]
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
    
  </StrictMode>,
)