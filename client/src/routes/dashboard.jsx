import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/constants";
import PortalLayout from "../layout/PortalLayout";
import "../routes_css/dashboard.css";

export default function Dashboard() {
    const [todos, setTodos] = useState([]);
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const auth = useAuth();
    
    useEffect(() => {
        loadTodos();
    }, []);
    
    async function handleSubmit(e) {
        e.preventDefault();
        if (title.trim()) {
            await createTodo();
            setTitle("");
        }
    }
    
    async function createTodo() {
        try {
            const response = await fetch(`${API_URL}/todos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${auth.getAccessToken()}`,
                },
                body: JSON.stringify({ title }),
            });
            
            if (response.ok) {
                const json = await response.json();
                setTodos([json, ...todos]);
            } else {
                console.error("Error al crear tarea");
            }
        } catch (error) {
            console.error("Error creating todo:", error);
        }
    }
    
    async function loadTodos() {
        try {
            const response = await fetch(`${API_URL}/todos`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${auth.getAccessToken()}`,
                },
            });
            
            if (response.ok) {
                const json = await response.json();
                setTodos(json);
            } else {
                console.error("Error al cargar tareas");
            }
        } catch (error) {
            console.error("Error loading todos:", error);
        } finally {
            setIsLoading(false);
        }
    }
    
    async function deleteTodo(id) {
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${auth.getAccessToken()}`,
                },
            });
            
            if (response.ok) {
                setTodos(todos.filter(todo => todo._id !== id));
            }
        } catch (error) {
            console.error("Error deleting todo:", error);
        }
    }
    
    const completedTodos = todos.filter(todo => todo.completed).length;
    const pendingTodos = todos.length - completedTodos;
    
    return (
        <PortalLayout>
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Bienvenido, {auth.getUser()?.name || auth.getUser()?.username}! 👋</h1>
                    <p className="dashboard-subtitle">Gestiona tus tareas de forma eficiente</p>
                </div>

                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-icon total">📋</div>
                        <div className="stat-info">
                            <h3>{todos.length}</h3>
                            <p>Total de tareas</p>
                        </div>
                    </div>
                </div>

                <div className="add-todo-section">
                    <h2>Agregar nueva tarea</h2>
                    <form className="todo-form" onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            placeholder="¿Qué necesitas hacer?" 
                            onChange={(e) => setTitle(e.target.value)} 
                            value={title}
                            className="todo-input"
                        />
                        <button type="submit" className="add-button">
                            ➕ Agregar
                        </button>
                    </form>
                </div>

                <div className="todos-section">
                    <h2>Mis tareas</h2>
                    {isLoading ? (
                        <p className="loading">Cargando tareas...</p>
                    ) : todos.length === 0 ? (
                        <p className="empty-state">
                            No tienes tareas aún. ¡Crea tu primera tarea! 🚀
                        </p>
                    ) : (
                        <div className="todos-list">
                            {todos.map((todo) => (
                                <div key={todo._id || todo.id} className="todo-item">
                                    <div className="todo-content">
                                        <span className="todo-icon">📌</span>
                                        <span className="todo-title">{todo.title}</span>
                                    </div>
                                    <button 
                                        className="delete-button"
                                        onClick={() => deleteTodo(todo._id || todo.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PortalLayout>
    );
}