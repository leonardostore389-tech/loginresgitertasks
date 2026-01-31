import PortalLayout from "../layout/PortalLayout";
import { useAuth } from "../auth/AuthProvider";
import "../routes_css/profile.css";
export default function Profile() {
    const auth = useAuth();
    const user = auth.getUser();

    return (
        <PortalLayout>
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <h1>{user?.name || user?.username}</h1>
                    <p className="profile-username">@{user?.username}</p>
                </div>

                <div className="profile-content">
                    <div className="about-section">
                        <h2>🎯 ¿Por qué creé esta aplicación?</h2>
                        <div className="about-text">
                            <p>
                                Esta aplicación de gestión de tareas nació de la necesidad de tener una herramienta 
                                <strong> simple, rápida y efectiva</strong> para organizar el día a día.
                            </p>
                            <p>
                                En un mundo lleno de distracciones, necesitaba algo que me permitiera 
                                <strong> enfocarme en lo importante</strong> sin complicaciones innecesarias.
                            </p>
                        </div>
                    </div>

                    <div className="features-section">
                        <h2>✨ Características principales</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <span className="feature-icon">⚡</span>
                                <h3>Rápida y eficiente</h3>
                                <p>Crea, edita y elimina tareas en segundos</p>
                            </div>

                            <div className="feature-card">
                                <span className="feature-icon">🔒</span>
                                <h3>Segura</h3>
                                <p>Tus datos están protegidos con autenticación JWT</p>
                            </div>

                            <div className="feature-card">
                                <span className="feature-icon">📊</span>
                                <h3>Visualización clara</h3>
                                <p>Dashboard con estadísticas de tu progreso</p>
                            </div>

                            <div className="feature-card">
                                <span className="feature-icon">🎨</span>
                                <h3>Diseño moderno</h3>
                                <p>Interfaz limpia con estilo hacker verde</p>
                            </div>

                            <div className="feature-card">
                                <span className="feature-icon">📱</span>
                                <h3>Responsive</h3>
                                <p>Funciona en cualquier dispositivo</p>
                            </div>

                            <div className="feature-card">
                                <span className="feature-icon">🚀</span>
                                <h3>En constante mejora</h3>
                                <p>Nuevas funciones próximamente</p>
                            </div>
                        </div>
                    </div>

                    <div className="tech-section">
                        <h2>🛠️ Tecnologías utilizadas</h2>
                        <div className="tech-stack">
                            <div className="tech-item">
                                <span className="tech-badge frontend">Frontend</span>
                                <p>React • React Router • CSS3</p>
                            </div>
                            <div className="tech-item">
                                <span className="tech-badge backend">Backend</span>
                                <p>Node.js • Express • MongoDB</p>
                            </div>
                            <div className="tech-item">
                                <span className="tech-badge auth">Seguridad</span>
                                <p>JWT • Bcrypt • Autenticación</p>
                            </div>
                        </div>
                    </div>

                    <div className="mission-section">
                        <h2>🎯 Mi objetivo</h2>
                        <blockquote>
                            "Ayudar a las personas a organizarse mejor y ser más productivas, 
                            una tarea a la vez."
                        </blockquote>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}