import { Link } from "react-router-dom";
import "./defaultlayout.css"; 

export default function DefaultLayout({ children }) {
    return (
        <>
            <header>
                <nav>
                    <ul>
                        <li><Link to="/">Pantalla Principal</Link></li>
                        <li><Link to="/signup">Registrate</Link></li>
                    </ul>
                </nav>
            </header>
            
            <h1>Manejo de Tareas</h1>

            <main className="container">
                {children}
            </main>
        </>    
    );
}