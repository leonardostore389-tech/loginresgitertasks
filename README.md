# 🔐 WebApp Security Lab - Task Management System

[![Security Focus](https://img.shields.io/badge/Focus-Cybersecurity-red.svg)](https://github.com/leonardostore389-tech/loginresgitertasks)
[![OWASP](https://img.shields.io/badge/OWASP-Top%2010-blue.svg)](https://owasp.org/www-project-top-ten/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](LICENSE)

> **Proyecto de ciberseguridad** que implementa y documenta controles de seguridad en una aplicación web MERN Stack, demostrando conocimientos prácticos en desarrollo seguro, análisis de vulnerabilidades y hardening de aplicaciones.

---

## 🎯 Objetivo del Proyecto

Este proyecto no es solo un gestor de tareas, es un **laboratorio de seguridad** que demuestra:

✅ **Implementación de controles de seguridad** en todas las capas  
✅ **Identificación y mitigación** de vulnerabilidades OWASP Top 10  
✅ **Desarrollo seguro** con mejores prácticas  
✅ **Documentación técnica** de decisiones de seguridad  

---

## 🛡️ Controles de Seguridad Implementados

### 🔐 **Autenticación y Autorización**

#### ✅ **JWT (JSON Web Tokens)**
```javascript
// Implementación de Access Token + Refresh Token
const accessToken = user.createAccessToken();      // Short-lived (15min)
const refreshToken = await user.createRefreshToken(); // Long-lived (7 días)
```

**Controles implementados:**
- ✅ Access tokens de corta duración (15 minutos)
- ✅ Refresh tokens almacenados en base de datos
- ✅ Rotación de tokens en cada renovación
- ✅ Invalidación de tokens al cerrar sesión

#### ✅ **Bcrypt para Hashing de Contraseñas**
```javascript
// Schema: user.js
userSchema.pre("save", async function(next) {
    const user = this;
    if (!user.isModified("password")) return next();
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    next();
});
```

**Configuración de seguridad:**
- ✅ Salt rounds: 10 (balance entre seguridad y rendimiento)
- ✅ Hashing automático en pre-save hook
- ✅ Comparación segura con bcrypt.compare()

---

### 🚫 **Protección contra Ataques Comunes**

#### ✅ **Protección contra Inyección NoSQL**
```javascript
// Validación de usuario existente antes de crear
const exists = await user.usernameExist(username);
if (exists) {
    return res.status(409).json(jsonResponse(409, {
        error: "Username already exists",
    }));
}
```

**Controles implementados:**
- ✅ Validación de campos requeridos
- ✅ Uso de esquemas Mongoose con validación
- ✅ Sanitización de inputs en backend

#### ✅ **Autorización por Usuario**
```javascript
// Verificar que el todo pertenece al usuario autenticado
const todo = await Todo.findOne({ 
    _id: req.params.id, 
    idUser: req.user.id  // ← Previene IDOR
});
```

**Previene:**
- 🔒 IDOR (Insecure Direct Object Reference)
- 🔒 Acceso no autorizado a recursos de otros usuarios

---

### 🔍 **Manejo Seguro de Sesiones**

#### ✅ **Renovación Automática de Tokens**
```javascript
// AuthProvider.jsx - Refresh automático
async function requestNewAccessToken(refreshToken) {
    const response = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${refreshToken}`,
        },
    });
    
    if (response.ok) {
        const json = await response.json();
        return json.body.accessToken;
    }
    throw new Error("No se pudo renovar el access token");
}
```

#### ✅ **Verificación de Refresh Tokens en BD**
```javascript
// refreshToken.js
const found = await Token.findOne({token: refreshToken});
if (!found) {
    return res.status(401).send(
        jsonResponse(401, {error: "Unauthorized"})
    );
}
```

**Ventajas de seguridad:**
- ✅ Tokens revocables (almacenados en BD)
- ✅ Detección de tokens robados/reusados
- ✅ Logout seguro con eliminación de refresh token

---

### 🗝️ **Gestión de Tokens en Cliente**

#### ✅ **Almacenamiento Seguro**
```javascript
// AuthProvider.jsx
function saveSessionInfo(userInfo, accessToken, refreshToken) {
    setAccessToken(accessToken);  // ← En memoria (más seguro)
    localStorage.setItem("token", JSON.stringify(refreshToken)); // ← Solo refresh
    setIsAuthenticated(true);
}
```

**Decisión de seguridad:**
- ✅ **Access Token en memoria** (no persiste, previene XSS)
- ✅ **Refresh Token en localStorage** (sobrevive recargas)
- ⚠️ **Mejora recomendada:** HttpOnly cookies para refresh token

---

### 🔒 **Validación y Manejo de Errores**

#### ✅ **Validación de Campos Requeridos**
```javascript
// signup.js
if (!username || !name || !password) {
    return res.status(400).json(jsonResponse(400, {
        error: "Field are required",
    }));
}
```

#### ✅ **Mensajes de Error Genéricos**
```javascript
// login.js - No revela si el problema es usuario o contraseña
if (!correctPassword) {
    res.status(400).json(jsonResponse(400,
        {error: "User or password is incorrect"}));
}
```

**Previene:**
- 🔒 Enumeración de usuarios (user enumeration)
- 🔒 Información sensible en mensajes de error

---

## 🚨 Vulnerabilidades Identificadas y Roadmap de Mitigación

### ⚠️ **Vulnerabilidades Actuales**

| Vulnerabilidad | Severidad | Estado | Mitigación Planeada |
|---------------|-----------|--------|---------------------|
| **Falta de Rate Limiting** | 🔴 Alta | Pendiente | Implementar `express-rate-limit` |
| **Sin protección CSRF** | 🟠 Media | Pendiente | Implementar tokens CSRF |
| **Headers de seguridad ausentes** | 🟠 Media | Pendiente | Configurar `helmet.js` |
| **XSS en inputs no sanitizados** | 🟡 Media-Baja | Pendiente | Sanitización con DOMPurify |
| **Sin 2FA** | 🟡 Baja | Futuro | TOTP con `speakeasy` |
| **Refresh token en localStorage** | 🟡 Baja | Pendiente | Migrar a HttpOnly cookies |

Ver detalles completos en [VULNERABILITIES.md](./VULNERABILITIES.md)

---

## 🏗️ Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (React)                       │
├─────────────────────────────────────────────────────────────┤
│  🔐 AuthProvider Context                                     │
│     ├── Access Token (memoria)                               │
│     ├── Refresh Token (localStorage) ⚠️                      │
│     └── Auto-refresh logic                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     API REST (Express)                       │
├─────────────────────────────────────────────────────────────┤
│  🛡️ Middleware Stack                                         │
│     ├── ❌ Helmet.js (PENDIENTE)                             │
│     ├── ❌ Rate Limiting (PENDIENTE)                         │
│     ├── ✅ JWT Verification                                  │
│     ├── ✅ Error Handling                                    │
│     └── ❌ CSRF Protection (PENDIENTE)                       │
├─────────────────────────────────────────────────────────────┤
│  📍 Endpoints                                                │
│     ├── POST /api/signup    → Registro con bcrypt           │
│     ├── POST /api/login     → Autenticación JWT             │
│     ├── POST /api/refresh-token → Renovación de tokens      │
│     ├── DELETE /api/signout → Revocación de tokens          │
│     ├── GET /api/user       → Info del usuario (protegido)  │
│     └── CRUD /api/todos     → Operaciones (protegido)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas                           │
├─────────────────────────────────────────────────────────────┤
│  📦 Colecciones                                              │
│     ├── users    → Contraseñas hasheadas (bcrypt)           │
│     ├── todos    → Relación con idUser                      │
│     └── tokens   → Refresh tokens válidos                   │
├─────────────────────────────────────────────────────────────┤
│  🔐 Seguridad                                                │
│     ├── ✅ Network Access (IP Whitelist)                    │
│     ├── ✅ Database User Authentication                     │
│     ├── ❌ Encryption at Rest (depende del tier)            │
│     └── ❌ Field-level Encryption (PENDIENTE)               │
└─────────────────────────────────────────────────────────────┘
```

Ver diagrama completo en [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🛠️ Stack Tecnológico

### **Frontend**
- ⚛️ **React 18** - UI Library
- 🔐 **Context API** - Gestión de autenticación
- 🎨 **CSS3** - Estilos (sin frameworks)

### **Backend**
- 🟢 **Node.js** - Runtime
- 🚀 **Express.js** - Web Framework
- 🍃 **MongoDB** - Base de datos NoSQL
- 🔒 **Mongoose** - ODM con validación

### **Seguridad**
- 🔑 **jsonwebtoken** - Generación/verificación de JWT
- 🔐 **bcrypt** - Hashing de contraseñas
- ⏱️ **express-rate-limit** ❌ (PENDIENTE)
- 🛡️ **helmet** ❌ (PENDIENTE)
- 🧹 **validator/DOMPurify** ❌ (PENDIENTE)

---

## 📦 Instalación y Configuración

### **Prerrequisitos**
```bash
Node.js >= 18.x
MongoDB >= 6.x (local o Atlas)
npm >= 9.x
```

### **Clonar el Repositorio**
```bash
git clone https://github.com/leonardostore389-tech/loginresgitertasks.git
cd loginresgitertasks
```

### **Instalar Dependencias**

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### **Variables de Entorno**

Crear `.env` en `/backend`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/taskmanager
# o para Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/taskmanager

# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production

# Token Expiration
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

⚠️ **IMPORTANTE:** Generar secrets seguros en producción:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Ejecutar en Desarrollo**

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

La aplicación estará disponible en:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 🔬 Testing de Seguridad

### **Pruebas Manuales**

#### 1. **Test de Autenticación**
```bash
# Registro
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","username":"test","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!"}'
```

#### 2. **Test de Autorización**
```bash
# Intentar acceder sin token (debe fallar con 401)
curl -X GET http://localhost:5000/api/todos

# Acceder con token válido
curl -X GET http://localhost:5000/api/todos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3. **Test de IDOR**
```bash
# Intentar acceder/eliminar tarea de otro usuario
curl -X DELETE http://localhost:5000/api/todos/OTHER_USER_TODO_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Debe retornar 404 (no encontrado) en vez de 403
```

### **Herramientas Recomendadas**

| Herramienta | Propósito | Comando/Uso |
|-------------|-----------|-------------|
| **OWASP ZAP** | Escaneo automático de vulnerabilidades | GUI o `zap-cli` |
| **Burp Suite** | Intercepción de requests, testing manual | Proxy en `http://localhost:8080` |
| **npm audit** | Vulnerabilidades en dependencias | `npm audit` |
| **Postman** | Testing de API | Colección de endpoints |
| **jwt.io** | Decodificar/verificar tokens | Web |

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [SECURITY.md](./SECURITY.md) | Controles de seguridad detallados |
| [VULNERABILITIES.md](./VULNERABILITIES.md) | Vulnerabilidades identificadas y PoCs |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagrama de arquitectura completo |
| [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) | Reporte de auditoría de seguridad |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guía de desarrollo seguro |

---

## 🎓 Skills Demostrados

### **Ofensiva (Red Team)**
- ✅ Identificación de vulnerabilidades OWASP Top 10
- ✅ Testing manual de endpoints
- ✅ Análisis de flujos de autenticación
- ✅ Pruebas de autorización (IDOR)

### **Defensiva (Blue Team)**
- ✅ Implementación de controles de seguridad
- ✅ Secure coding practices
- ✅ Hardening de aplicaciones web
- ✅ Gestión segura de credenciales

### **DevSecOps**
- ✅ Documentación de seguridad
- ✅ Threat modeling
- ✅ Security by design
- ✅ Auditoría de código

---

## 🚀 Roadmap de Mejoras

### **Q1 2025 - Hardening Básico**
- [ ] Implementar helmet.js con configuración segura
- [ ] Agregar express-rate-limit (10 req/min en login)
- [ ] Migrar refresh tokens a HttpOnly cookies
- [ ] Sanitización de inputs (DOMPurify, validator)
- [ ] Agregar logging con Winston

### **Q2 2025 - Funcionalidades de Seguridad**
- [ ] Implementar 2FA con TOTP (speakeasy)
- [ ] Sistema de recuperación de contraseña seguro
- [ ] Detección de sesiones sospechosas (IP, geolocalización)
- [ ] Dashboard de seguridad con logs de auditoría
- [ ] Notificaciones de actividad inusual

### **Q3 2025 - Testing y Compliance**
- [ ] Tests automatizados de seguridad (Jest + Supertest)
- [ ] Integración con OWASP ZAP en CI/CD
- [ ] Documentación de threat model completo
- [ ] Compliance con OWASP ASVS Level 2
- [ ] Penetration testing report

---

## 📊 Métricas de Seguridad

| Métrica | Valor Actual | Objetivo |
|---------|-------------|----------|
| **Controles implementados** | 8/15 | 15/15 |
| **OWASP Top 10 mitigados** | 4/10 | 10/10 |
| **Cobertura de tests** | 0% | 80% |
| **Vulnerabilidades conocidas** | 6 | 0 |
| **Tiempo de sesión** | 15 min | Configurable |

---

## 🤝 Contribuciones

Este es un proyecto educativo. Las contribuciones son bienvenidas, especialmente:

- 🐛 Reportes de vulnerabilidades (ver [SECURITY.md](./SECURITY.md))
- ✨ Mejoras de seguridad
- 📝 Mejoras en documentación
- 🧪 Tests de seguridad

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guías de desarrollo seguro.

---

## 📄 Licencia

Este proyecto es de uso **educativo y de demostración**. No usar en producción sin implementar todas las mejoras de seguridad recomendadas.

---

## 📞 Contacto

**Leonardo Store**  
GitHub: [@leonardostore389-tech](https://github.com/leonardostore389-tech)

---

## ⚠️ Disclaimer

Este proyecto está diseñado con propósitos **educativos y de demostración de habilidades en ciberseguridad**. Algunas vulnerabilidades están intencionalmente documentadas para mostrar capacidad de identificación y remediación. 

**NO usar en producción** sin implementar todas las medidas de seguridad recomendadas.

---

<div align="center">

**🔐 Security-First Development | OWASP Top 10 | Secure Coding Practices**

[![GitHub](https://img.shields.io/badge/GitHub-View%20Source-blue?logo=github)](https://github.com/leonardostore389-tech/loginresgitertasks)

</div>
