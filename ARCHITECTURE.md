# 🏗️ ARCHITECTURE.md - Arquitectura de Seguridad

## Índice
- [Visión General](#visión-general)
- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Flujos de Seguridad](#flujos-de-seguridad)
- [Modelos de Amenazas](#modelos-de-amenazas)
- [Capas de Seguridad](#capas-de-seguridad)

---

## 🎯 Visión General

Sistema de gestión de tareas con arquitectura cliente-servidor implementando múltiples capas de seguridad basadas en el principio de "defensa en profundidad".

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│           Frontend (React SPA)               │
│   - React 18                                 │
│   - Context API (Auth)                       │
│   - Fetch API                                │
└─────────────────────────────────────────────┘
                    ↓ HTTPS
┌─────────────────────────────────────────────┐
│         Backend (Node.js + Express)          │
│   - Express.js                               │
│   - JWT Authentication                       │
│   - Mongoose ODM                             │
└─────────────────────────────────────────────┘
                    ↓ MongoDB Protocol
┌─────────────────────────────────────────────┐
│          Database (MongoDB)                  │
│   - MongoDB 6.x                              │
│   - Atlas (Cloud) o Local                    │
└─────────────────────────────────────────────┘
```

---

## 📐 Arquitectura de Componentes

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (React App)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              AuthProvider (Context)                     │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • isAuthenticated: boolean                            │    │
│  │  • accessToken: string (memoria) 🔐                    │    │
│  │  • refreshToken: string (localStorage) ⚠️              │    │
│  │  • user: UserObject                                    │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  Métodos:                                              │    │
│  │  • saveUser(userData)                                  │    │
│  │  • getAccessToken()                                    │    │
│  │  • getRefreshToken()                                   │    │
│  │  • requestNewAccessToken()                             │    │
│  │  • checkAuth()                                         │    │
│  │  • signOut()                                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                     Rutas                               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  Públicas:                                             │    │
│  │  • /              → Login                              │    │
│  │  • /signup        → Signup                             │    │
│  │                                                         │    │
│  │  Protegidas (ProtectedRoute):                          │    │
│  │  • /dashboard     → Dashboard (CRUD tareas)            │    │
│  │  • /profile       → Profile                            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API REST (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               Middleware Stack                          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  1. cors()                 ✅ Implementado             │    │
│  │  2. express.json()         ✅ Implementado             │    │
│  │  3. helmet()               ❌ PENDIENTE                │    │
│  │  4. rateLimit()            ❌ PENDIENTE                │    │
│  │  5. csrf()                 ❌ PENDIENTE                │    │
│  │  6. authenticate()         ✅ Implementado             │    │
│  │  7. errorHandler()         ✅ Implementado             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   Endpoints                             │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  Públicos:                                             │    │
│  │  • POST   /api/signup                                  │    │
│  │  • POST   /api/login                                   │    │
│  │  • POST   /api/refresh-token                           │    │
│  │                                                         │    │
│  │  Protegidos (requiere JWT):                            │    │
│  │  • GET    /api/user                                    │    │
│  │  • GET    /api/todos                                   │    │
│  │  • POST   /api/todos                                   │    │
│  │  • DELETE /api/todos/:id                               │    │
│  │  • DELETE /api/signout                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Lógica de Negocio                          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • Generación de JWT (access + refresh)                │    │
│  │  • Verificación de JWT                                 │    │
│  │  • Hashing de contraseñas (bcrypt)                     │    │
│  │  • Validación de inputs                                │    │
│  │  • Autorización por usuario                            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Mongoose
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               Colecciones                               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  users:                                                │    │
│  │  {                                                     │    │
│  │    _id: ObjectId,                                      │    │
│  │    username: String (único),                           │    │
│  │    name: String,                                       │    │
│  │    password: String (bcrypt hash) 🔐                   │    │
│  │    createdAt: Date                                     │    │
│  │  }                                                     │    │
│  │                                                         │    │
│  │  todos:                                                │    │
│  │  {                                                     │    │
│  │    _id: ObjectId,                                      │    │
│  │    title: String,                                      │    │
│  │    completed: Boolean,                                 │    │
│  │    idUser: ObjectId (ref: users) 🔗                    │    │
│  │    createdAt: Date                                     │    │
│  │  }                                                     │    │
│  │                                                         │    │
│  │  tokens:                                               │    │
│  │  {                                                     │    │
│  │    _id: ObjectId,                                      │    │
│  │    token: String (refresh token),                      │    │
│  │    user: ObjectId (ref: users) 🔗                      │    │
│  │    createdAt: Date,                                    │    │
│  │    expiresAt: Date                                     │    │
│  │  }                                                     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Flujos de Seguridad

### 1. Flujo de Registro (Signup)

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Cliente │                 │ Backend  │                 │ MongoDB  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ POST /api/signup           │                            │
     │ {name, username, password} │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ Validar campos requeridos  │
     │                            │ if (!name || !username...) │
     │                            │                            │
     │                            │ Verificar usuario existe   │
     │                            ├───────────────────────────>│
     │                            │ findOne({username})        │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ Si existe:                 │
     │                            │   return 409 Conflict      │
     │                            │                            │
     │                            │ Hash password (bcrypt)     │
     │                            │ salt = genSalt(10)         │
     │                            │ hash = hash(password, salt)│
     │                            │                            │
     │                            │ Guardar usuario            │
     │                            ├───────────────────────────>│
     │                            │ save({username, name, hash})│
     │                            │<───────────────────────────┤
     │                            │                            │
     │<───────────────────────────┤                            │
     │ 200 OK                     │                            │
     │ {message: "User created"}  │                            │
     │                            │                            │
     │ Redirect to /login         │                            │
     │                            │                            │
```

**Controles de Seguridad:**
1. ✅ Validación de campos requeridos
2. ✅ Verificación de duplicados
3. ✅ Hashing de contraseña con bcrypt (10 salt rounds)
4. ❌ Sin validación de complejidad de contraseña
5. ❌ Sin rate limiting (vulnerable a spam)

---

### 2. Flujo de Autenticación (Login)

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Cliente │                 │ Backend  │                 │ MongoDB  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ POST /api/login            │                            │
     │ {username, password}       │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ Validar campos             │
     │                            │                            │
     │                            │ Buscar usuario             │
     │                            ├───────────────────────────>│
     │                            │ findOne({username})        │
     │                            │<───────────────────────────┤
     │                            │ user                       │
     │                            │                            │
     │                            │ if (!user)                 │
     │                            │   return 400 "User not found"│ ⚠️ User Enumeration
     │                            │                            │
     │                            │ Comparar contraseña        │
     │                            │ bcrypt.compare(password,   │
     │                            │   user.password)           │
     │                            │                            │
     │                            │ if (!match)                │
     │                            │   return 400 "Incorrect"   │
     │                            │                            │
     │                            │ Generar Access Token       │
     │                            │ jwt.sign({user: id},       │
     │                            │   SECRET, {expiresIn: 15m})│
     │                            │                            │
     │                            │ Generar Refresh Token      │
     │                            │ jwt.sign({user: id},       │
     │                            │   SECRET, {expiresIn: 7d}) │
     │                            │                            │
     │                            │ Guardar Refresh Token      │
     │                            ├───────────────────────────>│
     │                            │ Token.save({token, user})  │
     │                            │<───────────────────────────┤
     │                            │                            │
     │<───────────────────────────┤                            │
     │ 200 OK                     │                            │
     │ {user, accessToken,        │                            │
     │  refreshToken}             │                            │
     │                            │                            │
     │ AuthProvider.saveUser()    │                            │
     │ • accessToken → memoria    │                            │
     │ • refreshToken → localStorage ⚠️                        │
     │                            │                            │
     │ Navigate to /dashboard     │                            │
     │                            │                            │
```

**Controles de Seguridad:**
1. ✅ Validación de credenciales
2. ✅ Comparación segura con bcrypt
3. ✅ Tokens JWT con expiración
4. ✅ Refresh token almacenado en BD (revocable)
5. ⚠️ Refresh token en localStorage (XSS risk)
6. ❌ Sin rate limiting (brute force vulnerable)
7. ⚠️ User enumeration (diferentes mensajes de error)

---

### 3. Flujo de Renovación de Token

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Cliente │                 │ Backend  │                 │ MongoDB  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ useEffect() al cargar      │                            │
     │ AuthProvider.checkAuth()   │                            │
     │                            │                            │
     │ Access token expirado?     │                            │
     │ Obtener refresh token      │                            │
     │ localStorage.getItem()     │                            │
     │                            │                            │
     │ POST /api/refresh-token    │                            │
     │ Authorization: Bearer      │                            │
     │   refreshToken             │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ Extraer token del header   │
     │                            │                            │
     │                            │ Verificar token existe     │
     │                            │ en BD                      │
     │                            ├───────────────────────────>│
     │                            │ findOne({token})           │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ if (!found)                │
     │                            │   return 401 Unauthorized  │
     │                            │                            │
     │                            │ Verificar firma JWT        │
     │                            │ jwt.verify(token, SECRET)  │
     │                            │                            │
     │                            │ if (!valid)                │
     │                            │   return 401 Unauthorized  │
     │                            │                            │
     │                            │ Generar nuevo Access Token │
     │                            │ jwt.sign({user: payload.id})│
     │                            │                            │
     │<───────────────────────────┤                            │
     │ 200 OK                     │                            │
     │ {accessToken}              │                            │
     │                            │                            │
     │ AuthProvider.saveSessionInfo()                          │
     │ • Actualizar accessToken   │                            │
     │   en memoria               │                            │
     │                            │                            │
     │ Continuar navegación       │                            │
     │                            │                            │
```

**Controles de Seguridad:**
1. ✅ Verificación en BD (tokens revocables)
2. ✅ Verificación de firma JWT
3. ✅ Nuevo access token de corta duración
4. ❌ Sin rotación de refresh token
5. ❌ Sin detección de reutilización

---

### 4. Flujo de Autorización (CRUD Tareas)

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Cliente │                 │ Backend  │                 │ MongoDB  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ POST /api/todos            │                            │
     │ Authorization: Bearer      │                            │
     │   accessToken              │                            │
     │ {title: "Nueva tarea"}     │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ authenticate() middleware  │
     │                            │ Extraer token              │
     │                            │                            │
     │                            │ Verificar JWT              │
     │                            │ jwt.verify(token, SECRET)  │
     │                            │                            │
     │                            │ if (!valid)                │
     │                            │   return 401 Unauthorized  │
     │                            │                            │
     │                            │ Extraer userId del payload │
     │                            │ req.user = {id: userId}    │
     │                            │                            │
     │                            │ Validar input              │
     │                            │ if (!title)                │
     │                            │   return 400 Bad Request   │
     │                            │                            │
     │                            │ Crear TODO asociado        │
     │                            │ al usuario autenticado     │
     │                            ├───────────────────────────>│
     │                            │ Todo.save({                │
     │                            │   title,                   │
     │                            │   idUser: req.user.id 🔐   │
     │                            │ })                         │
     │                            │<───────────────────────────┤
     │                            │                            │
     │<───────────────────────────┤                            │
     │ 201 Created                │                            │
     │ {_id, title, completed,    │                            │
     │  idUser}                   │                            │
     │                            │                            │
```

**Ejemplo de Autorización en DELETE:**

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Cliente │                 │ Backend  │                 │ MongoDB  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ DELETE /api/todos/:id      │                            │
     │ Authorization: Bearer token│                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ authenticate() middleware  │
     │                            │ req.user = {id: userId}    │
     │                            │                            │
     │                            │ Verificar propiedad        │
     │                            ├───────────────────────────>│
     │                            │ findOne({                  │
     │                            │   _id: req.params.id,      │
     │                            │   idUser: req.user.id 🔐   │
     │                            │ })                         │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │ if (!todo)                 │
     │                            │   return 404 Not Found     │
     │                            │   // Previene IDOR 🛡️      │
     │                            │                            │
     │                            │ Eliminar TODO              │
     │                            ├───────────────────────────>│
     │                            │ deleteOne({_id})           │
     │                            │<───────────────────────────┤
     │                            │                            │
     │<───────────────────────────┤                            │
     │ 200 OK                     │                            │
     │ {message: "Deleted"}       │                            │
     │                            │                            │
```

**Controles de Seguridad:**
1. ✅ Autenticación con JWT
2. ✅ Autorización por usuario (idUser check)
3. ✅ Prevención de IDOR (404 en vez de 403)
4. ❌ Sin validación de inputs (XSS vulnerable)
5. ❌ Sin rate limiting

---

### 5. Flujo de Logout

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Cliente │                 │ Backend  │                 │ MongoDB  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ Usuario hace click en      │                            │
     │ "Cerrar Sesión"            │                            │
     │                            │                            │
     │ DELETE /api/signout        │                            │
     │ Authorization: Bearer      │                            │
     │   refreshToken             │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ Extraer refresh token      │
     │                            │                            │
     │                            │ Eliminar token de BD       │
     │                            ├───────────────────────────>│
     │                            │ findOneAndDelete({token})  │
     │                            │<───────────────────────────┤
     │                            │                            │
     │<───────────────────────────┤                            │
     │ 200 OK                     │                            │
     │ {message: "Token deleted"} │                            │
     │                            │                            │
     │ AuthProvider.signOut()     │                            │
     │ • Limpiar accessToken      │                            │
     │ • Limpiar refreshToken     │                            │
     │ • localStorage.removeItem()│                            │
     │ • setIsAuthenticated(false)│                            │
     │                            │                            │
     │ Navigate to /              │                            │
     │                            │                            │
```

**Controles de Seguridad:**
1. ✅ Eliminación efectiva del refresh token
2. ✅ Limpieza de estado en cliente
3. ✅ Tokens no reutilizables después de logout

---

## 🛡️ Capas de Seguridad

### Modelo de Defensa en Profundidad

```
┌─────────────────────────────────────────────────────────┐
│                Layer 1: Perímetro                        │
│  ❌ Sin Firewall / WAF                                   │
│  ❌ Sin Rate Limiting                                    │
│  ❌ Sin IDS/IPS                                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Layer 2: Transporte                         │
│  ⚠️ HTTPS (recomendado en producción)                   │
│  ❌ Sin Certificate Pinning                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           Layer 3: Aplicación (Frontend)                 │
│  ✅ ProtectedRoute (navegación)                          │
│  ✅ Token en memoria (access token)                      │
│  ⚠️ Token en localStorage (refresh token)                │
│  ❌ Sin sanitización de inputs                           │
│  ❌ Sin Content Security Policy                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│            Layer 4: API (Backend)                        │
│  ✅ JWT Authentication                                   │
│  ✅ Authorization por usuario                            │
│  ✅ Validación básica de inputs                          │
│  ❌ Sin Rate Limiting                                    │
│  ❌ Sin Security Headers (Helmet)                        │
│  ❌ Sin CSRF Protection                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│          Layer 5: Lógica de Negocio                      │
│  ✅ Bcrypt para contraseñas (10 rounds)                  │
│  ✅ Tokens revocables (BD)                               │
│  ✅ IDOR Prevention                                      │
│  ❌ Sin validación de complejidad de password            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│             Layer 6: Base de Datos                       │
│  ✅ Mongoose schemas con validación                      │
│  ✅ Relaciones con ObjectId                              │
│  ⚠️ MongoDB sin autenticación (dev)                      │
│  ❌ Sin cifrado at-rest (depende del tier)               │
│  ❌ Sin field-level encryption                           │
└─────────────────────────────────────────────────────────┘
```

### Puntuación de Seguridad por Capa

| Capa | Implementado | Pendiente | Score |
|------|--------------|-----------|-------|
| 1. Perímetro | 0/3 | 3/3 | 0% |
| 2. Transporte | 0/2 | 2/2 | 0% |
| 3. Frontend | 2/5 | 3/5 | 40% |
| 4. API | 3/6 | 3/6 | 50% |
| 5. Lógica | 3/4 | 1/4 | 75% |
| 6. Base de Datos | 2/5 | 3/5 | 40% |
| **TOTAL** | **10/25** | **15/25** | **40%** |

---

## ⚠️ Modelos de Amenazas (STRIDE)

### Análisis STRIDE por Componente

#### Frontend (React App)

| Amenaza | Riesgo | Mitigación Actual | Estado |
|---------|--------|-------------------|--------|
| **Spoofing** | Bajo | ProtectedRoute | ✅ |
| **Tampering** | Alto | Ninguna | ❌ |
| **Repudiation** | Bajo | Logs en backend | ⚠️ |
| **Information Disclosure** | Alto | Token en localStorage | ❌ |
| **Denial of Service** | Medio | Ninguna | ❌ |
| **Elevation of Privilege** | Medio | Authorization check | ✅ |

#### Backend API

| Amenaza | Riesgo | Mitigación Actual | Estado |
|---------|--------|-------------------|--------|
| **Spoofing** | Medio | JWT verification | ✅ |
| **Tampering** | Alto | JWT signature | ✅ |
| **Repudiation** | Medio | Logs básicos | ⚠️ |
| **Information Disclosure** | Alto | Sin headers seguridad | ❌ |
| **Denial of Service** | Alto | Sin rate limiting | ❌ |
| **Elevation of Privilege** | Bajo | idUser check | ✅ |

#### Base de Datos

| Amenaza | Riesgo | Mitigación Actual | Estado |
|---------|--------|-------------------|--------|
| **Spoofing** | Bajo | User auth (prod) | ⚠️ |
| **Tampering** | Medio | Mongoose validation | ✅ |
| **Repudiation** | Alto | Sin audit logs | ❌ |
| **Information Disclosure** | Alto | Passwords hasheadas | ✅ |
| **Denial of Service** | Medio | Connection limits | ⚠️ |
| **Elevation of Privilege** | Bajo | Schema enforcement | ✅ |

---

## 📊 Superficie de Ataque

### Endpoints Públicos (Sin Autenticación)

```
POST /api/signup
  ├─ Input: {name, username, password}
  ├─ Validación: Campos requeridos
  ├─ Vulnerabilidades:
  │   ├─ ❌ Sin rate limiting (spam)
  │   ├─ ❌ Sin CAPTCHA
  │   ├─ ❌ Sin validación de password
  │   └─ ⚠️ User enumeration (409 si existe)
  └─ Mitigación: Implementar rate limiting + validación

POST /api/login
  ├─ Input: {username, password}
  ├─ Validación: Campos requeridos
  ├─ Vulnerabilidades:
  │   ├─ ❌ Sin rate limiting (brute force)
  │   ├─ ❌ Sin account lockout
  │   ├─ ❌ Sin CAPTCHA
  │   └─ ⚠️ User enumeration
  └─ Mitigación: Rate limiting + mensajes genéricos

POST /api/refresh-token
  ├─ Input: Authorization header
  ├─ Validación: Token existe en BD
  ├─ Vulnerabilidades:
  │   ├─ ❌ Sin rotación de tokens
  │   └─ ❌ Sin detección de reutilización
  └─ Mitigación: Token rotation + reuse detection
```

### Endpoints Protegidos (Requieren JWT)

```
GET /api/user
  ├─ Autenticación: JWT required
  ├─ Autorización: Self (propio usuario)
  └─ Vulnerabilidades: Ninguna crítica

GET /api/todos
  ├─ Autenticación: JWT required
  ├─ Autorización: Filtrado por idUser
  └─ Vulnerabilidades: Ninguna crítica

POST /api/todos
  ├─ Input: {title}
  ├─ Autenticación: JWT required
  ├─ Autorización: idUser automático
  ├─ Vulnerabilidades:
  │   ├─ ❌ XSS (sin sanitización)
  │   └─ ❌ Sin validación de longitud
  └─ Mitigación: Sanitización + validación

DELETE /api/todos/:id
  ├─ Autenticación: JWT required
  ├─ Autorización: Verificación de ownership
  ├─ Vulnerabilidades:
  │   └─ ⚠️ Information disclosure (404 vs 403)
  └─ Mitigación: Usar 404 (ya implementado)

DELETE /api/signout
  ├─ Autenticación: Refresh token
  ├─ Autorización: Token ownership
  └─ Vulnerabilidades: Ninguna crítica
```

---

## 🔧 Mejoras Arquitectónicas Recomendadas

### Corto Plazo (1-2 semanas)

1. **Implementar Helmet.js**
   - Security headers completos
   - CSP para prevenir XSS
   - X-Frame-Options contra clickjacking

2. **Rate Limiting**
   - Login: 5 intentos / 15 minutos
   - Signup: 3 registros / hora
   - API general: 100 req/min

3. **Migrar Refresh Tokens a HttpOnly Cookies**
   - Inmune a XSS
   - SameSite para CSRF protection

### Medio Plazo (3-4 semanas)

4. **Sanitización de Inputs**
   - Backend: validator.js
   - Frontend: DOMPurify
   - Validación con Joi/Zod

5. **CSRF Protection**
   - Tokens CSRF o
   - SameSite cookies + custom headers

6. **Logging y Monitoreo**
   - Winston para logs centralizados
   - Eventos de seguridad críticos
   - Alertas automáticas

### Largo Plazo (2+ meses)

7. **Autenticación Multifactor (2FA)**
   - TOTP con speakeasy
   - Backup codes
   - SMS/Email fallback

8. **Sesiones Avanzadas**
   - Device fingerprinting
   - Detección de ubicación anómala
   - Notificaciones de nuevos logins

9. **Compliance**
   - GDPR: Exportación de datos
   - Auditoría completa (logs inmutables)
   - Política de retención

---

## 📚 Referencias

- [OWASP Application Security Architecture](https://owasp.org/www-project-application-security-verification-standard/)
- [STRIDE Threat Model](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [Defense in Depth](https://csrc.nist.gov/glossary/term/defense_in_depth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Última actualización:** Febrero 2025  
**Versión:** 1.0.0
