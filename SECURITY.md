# 🛡️ SECURITY.md - Documentación de Controles de Seguridad

## Índice
- [Política de Seguridad](#política-de-seguridad)
- [Controles Implementados](#controles-implementados)
- [Configuración de Seguridad](#configuración-de-seguridad)
- [Reportar Vulnerabilidades](#reportar-vulnerabilidades)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🔒 Política de Seguridad

### Versiones Soportadas

| Versión | Soporte de Seguridad |
| ------- | -------------------- |
| 1.0.x   | ✅ Activo            |
| < 1.0   | ❌ Sin soporte       |

### Alcance de Seguridad

Este proyecto implementa seguridad en las siguientes capas:

- **Autenticación** - JWT con refresh tokens
- **Autorización** - Control de acceso basado en usuario
- **Gestión de Sesiones** - Tokens de corta duración
- **Protección de Datos** - Hashing de contraseñas
- **Validación de Entrada** - Validación básica en backend

---

## ✅ Controles Implementados

### 1. Autenticación JWT (JSON Web Tokens)

#### 📋 Descripción
Sistema de autenticación basado en tokens con dos tipos de tokens:
- **Access Token**: Token de corta duración (15 minutos) para autenticación de requests
- **Refresh Token**: Token de larga duración (7 días) para renovar access tokens

#### 🔧 Implementación

**Generación de Tokens:**
```javascript
// backend/schema/user.js
userSchema.methods.createAccessToken = function() {
    return jwt.sign(
        { user: this._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );
};

userSchema.methods.createRefreshToken = async function() {
    const refreshToken = jwt.sign(
        { user: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
    
    // Almacenar en BD para revocación
    await new Token({ 
        token: refreshToken,
        user: this._id 
    }).save();
    
    return refreshToken;
};
```

**Verificación de Tokens:**
```javascript
// backend/routes/refreshToken.js
const found = await Token.findOne({token: refreshToken});
if (!found) {
    return res.status(401).send(
        jsonResponse(401, {error: "Unauthorized"})
    );
}

const payload = verifyRefreshToken(found.token);
if (payload) {
    const accessToken = generateAccessToken(payload.user);
    return res.status(200).json(jsonResponse(200, {accessToken}));
}
```

#### 🎯 Amenazas Mitigadas
- ✅ **Token Theft**: Access tokens expiran en 15 minutos
- ✅ **Session Hijacking**: Refresh tokens almacenados en BD (revocables)
- ✅ **Credential Reuse**: Tokens únicos por sesión

#### ⚠️ Limitaciones Actuales
- ❌ Refresh tokens en localStorage (vulnerable a XSS)
- ❌ Sin rotación de refresh tokens
- ❌ Sin detección de tokens reusados

#### 🔧 Mejoras Recomendadas
```javascript
// 1. Migrar a HttpOnly Cookies
res.cookie('refreshToken', refreshToken, {
    httpOnly: true,      // No accesible desde JavaScript
    secure: true,        // Solo HTTPS
    sameSite: 'strict',  // Protección CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000
});

// 2. Rotación de refresh tokens
userSchema.methods.rotateRefreshToken = async function(oldToken) {
    await Token.deleteOne({ token: oldToken });
    return await this.createRefreshToken();
};

// 3. Detección de reuso
const tokenUsage = await TokenUsage.findOne({ token: refreshToken });
if (tokenUsage && tokenUsage.used) {
    // Token reusado - posible robo
    await revokeAllUserTokens(userId);
    throw new Error("Token reuse detected");
}
```

---

### 2. Bcrypt - Hashing de Contraseñas

#### 📋 Descripción
Todas las contraseñas son hasheadas usando bcrypt con salt rounds configurables antes de ser almacenadas en la base de datos.

#### 🔧 Implementación

```javascript
// backend/schema/user.js
const bcrypt = require('bcrypt');

userSchema.pre("save", async function(next) {
    const user = this;
    
    // Solo hashear si la contraseña fue modificada
    if (!user.isModified("password")) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};
```

**Uso en Login:**
```javascript
// backend/routes/login.js
const user = await User.findOne({username});
if (user) {
    const correctPassword = await user.comparePassword(password, user.password);
    if (correctPassword) {
        // Autenticación exitosa
    }
}
```

#### 🎯 Configuración de Seguridad

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| **Salt Rounds** | 10 | Balance entre seguridad y rendimiento |
| **Algoritmo** | bcrypt | Resistente a ataques de GPU/ASIC |
| **Timing** | Pre-save hook | Automático, no requiere intervención manual |

#### 📊 Comparación de Tiempos de Hash

| Salt Rounds | Tiempo aprox. | Uso Recomendado |
|-------------|---------------|-----------------|
| 8 | ~40ms | ❌ Demasiado rápido |
| 10 | ~100ms | ✅ **Actual** - Óptimo |
| 12 | ~250ms | ⚠️ Alta seguridad |
| 14 | ~600ms | ⚠️ Máxima seguridad |

#### 🎯 Amenazas Mitigadas
- ✅ **Rainbow Table Attacks**: Salt único por contraseña
- ✅ **Brute Force**: Hash lento (~100ms)
- ✅ **Database Breach**: Contraseñas no reversibles

#### ⚠️ Limitaciones Actuales
- ❌ Sin política de complejidad de contraseñas
- ❌ Sin detección de contraseñas débiles
- ❌ Sin verificación contra listas de contraseñas comprometidas

#### 🔧 Mejoras Recomendadas

**1. Validación de Contraseñas:**
```javascript
const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character'
    });
```

**2. Detección de Contraseñas Comprometidas:**
```javascript
const axios = require('axios');
const crypto = require('crypto');

async function isPasswordPwned(password) {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
    return response.data.includes(suffix);
}
```

---

### 3. Autorización Basada en Usuario (RBAC Básico)

#### 📋 Descripción
Control de acceso que asegura que los usuarios solo puedan acceder y modificar sus propios recursos.

#### 🔧 Implementación

**Middleware de Autenticación:**
```javascript
// backend/auth/authenticate.js
const authenticate = (req, res, next) => {
    const token = getTokenFromHeader(req.headers);
    
    if (!token) {
        return res.status(401).json({error: "Unauthorized"});
    }
    
    try {
        const payload = verifyAccessToken(token);
        req.user = payload.user;
        next();
    } catch (error) {
        return res.status(401).json({error: "Invalid token"});
    }
};
```

**Verificación de Propiedad de Recursos:**
```javascript
// backend/routes/todos.js
router.delete("/:id", async (req, res) => {
    // Verificar que el TODO pertenece al usuario
    const todo = await Todo.findOne({ 
        _id: req.params.id, 
        idUser: req.user.id  // ← Previene IDOR
    });
    
    if (!todo) {
        return res.status(404).json({
            error: "Todo no encontrado"
        });
    }
    
    await Todo.deleteOne({ _id: req.params.id });
});
```

#### 🎯 Amenazas Mitigadas
- ✅ **IDOR (Insecure Direct Object Reference)**: Usuario A no puede acceder a recursos de Usuario B
- ✅ **Privilege Escalation**: Solo el propietario puede modificar/eliminar sus recursos
- ✅ **Data Leakage**: Consultas filtradas por usuario autenticado

#### ⚠️ Casos de Prueba

```bash
# Test 1: Acceso sin token
curl -X GET http://localhost:5000/api/todos
# Esperado: 401 Unauthorized

# Test 2: Acceso con token inválido
curl -X GET http://localhost:5000/api/todos \
  -H "Authorization: Bearer invalid-token"
# Esperado: 401 Invalid token

# Test 3: Intentar eliminar TODO de otro usuario
curl -X DELETE http://localhost:5000/api/todos/OTHER_USER_TODO_ID \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"
# Esperado: 404 Todo no encontrado (no 403 - previene enumeración)
```

#### 🔧 Mejoras Recomendadas

**1. Roles de Usuario:**
```javascript
const userSchema = new Schema({
    username: String,
    password: String,
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    }
});

// Middleware de autorización
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({error: "Forbidden"});
        }
        next();
    };
};

// Uso
router.delete("/admin/users/:id", 
    authenticate, 
    authorize(['admin']), 
    deleteUser
);
```

---

### 4. Validación de Entrada

#### 📋 Descripción
Validación básica de campos requeridos en el backend para prevenir datos malformados.

#### 🔧 Implementación Actual

```javascript
// backend/routes/signup.js
if (!username || !name || !password) {
    return res.status(400).json(jsonResponse(400, {
        error: "Field are required",
    }));
}

// backend/routes/todos.js
if (!req.body.title) {
    res.status(400).json({
        error: "El título es requerido"
    });
}
```

#### ⚠️ Limitaciones Actuales
- ❌ Solo valida campos requeridos
- ❌ No valida formato/tipo de datos
- ❌ No sanitiza inputs (XSS vulnerable)
- ❌ No valida longitud máxima

#### 🔧 Mejoras Recomendadas

**1. Validación con Joi:**
```javascript
const Joi = require('joi');

const signupSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .required()
});

router.post("/signup", async (req, res) => {
    const { error, value } = signupSchema.validate(req.body);
    
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }
    
    // Continuar con value validado
});
```

**2. Sanitización de Inputs:**
```javascript
const validator = require('validator');

// En el frontend
import DOMPurify from 'dompurify';

function sanitizeInput(input) {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
}

// Uso
const cleanTitle = sanitizeInput(title);
```

---

### 5. Gestión Segura de Sesiones

#### 📋 Descripción
Sistema de renovación automática de tokens que verifica la validez de refresh tokens en cada uso.

#### 🔧 Implementación

**Renovación Automática en Cliente:**
```javascript
// frontend/auth/AuthProvider.jsx
async function checkAuth() {
    if (accessToken) {
        // Token en memoria, verificar validez
        const userInfo = await getUserInfo(accessToken);
        if (userInfo) {
            saveSessionInfo(userInfo, accessToken, getRefreshToken());
            return;
        }
    }
    
    // Si no hay access token, intentar renovar
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        const newAccessToken = await requestNewAccessToken(refreshToken);
        if (newAccessToken) {
            const userInfo = await getUserInfo(newAccessToken);
            if (userInfo) {
                saveSessionInfo(userInfo, newAccessToken, refreshToken);
            }
        }
    }
}
```

**Revocación al Cerrar Sesión:**
```javascript
// backend/routes/signout.js
router.delete("/", async (req, res) => {
    const refreshToken = getTokenFromHeader(req.headers);
    
    if (refreshToken) {
        await Token.findOneAndDelete({ token: refreshToken });
        
        res.status(200).json(
            jsonResponse(200, {message: "Token deleted"})
        );
    }
});
```

#### 🎯 Amenazas Mitigadas
- ✅ **Session Fixation**: Tokens únicos por sesión
- ✅ **Token Reuse**: Tokens almacenados en BD, verificables
- ✅ **Logout**: Revocación efectiva de tokens

#### ⚠️ Limitaciones Actuales
- ❌ Tokens no rotan en cada refresh
- ❌ Sin detección de múltiples dispositivos
- ❌ Sin notificaciones de nuevas sesiones

---

## 🔧 Configuración de Seguridad

### Variables de Entorno Críticas

```env
# JWT Secrets - CAMBIAR EN PRODUCCIÓN
ACCESS_TOKEN_SECRET=generate-with-crypto.randomBytes(64).toString('hex')
REFRESH_TOKEN_SECRET=generate-with-crypto.randomBytes(64).toString('hex')

# Token Expiration
ACCESS_TOKEN_EXPIRATION=15m   # Ajustar según necesidades
REFRESH_TOKEN_EXPIRATION=7d   # Máximo recomendado: 30d

# MongoDB
MONGODB_URI=mongodb+srv://...  # Usar Atlas con IP whitelist

# CORS
FRONTEND_URL=https://yourdomain.com  # Solo dominios confiables
```

### Generación de Secrets Seguros

```bash
# Generar secret de 256 bits
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar secret de 512 bits (recomendado)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚨 Reportar Vulnerabilidades

### Proceso de Reporte

Si encuentras una vulnerabilidad de seguridad, por favor:

1. **NO** abras un issue público
2. Envía un email a: **[TU EMAIL]** con:
   - Descripción de la vulnerabilidad
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación (opcional)

3. Espera respuesta en **48 horas**

### Qué Reportar

- ✅ Vulnerabilidades de autenticación/autorización
- ✅ Inyecciones (SQL, NoSQL, XSS, etc.)
- ✅ Exposición de datos sensibles
- ✅ Problemas de configuración de seguridad
- ✅ Problemas de gestión de sesiones

### Qué NO Reportar

- ❌ Vulnerabilidades ya documentadas en [VULNERABILITIES.md](./VULNERABILITIES.md)
- ❌ Issues de usabilidad o bugs funcionales
- ❌ Mejoras de rendimiento

---

## 📚 Mejores Prácticas

### Para Desarrolladores

1. **Nunca** commitees secrets/tokens al repositorio
2. **Siempre** valida inputs en backend (no confíes en frontend)
3. **Usa** prepared statements para queries (Mongoose lo hace por defecto)
4. **Hashea** contraseñas con bcrypt (nunca almacenes plaintext)
5. **Implementa** logging para eventos de seguridad críticos
6. **Revisa** dependencias con `npm audit`

### Para Despliegue

1. **Usa HTTPS** en producción (obligatorio)
2. **Configura** CORS correctamente (solo dominios confiables)
3. **Habilita** rate limiting
4. **Implementa** headers de seguridad con Helmet
5. **Monitorea** logs de seguridad
6. **Mantén** dependencias actualizadas

### Checklist de Seguridad

- [ ] Secrets generados con `crypto.randomBytes()`
- [ ] Variables de entorno en `.env` (no en código)
- [ ] `.env` en `.gitignore`
- [ ] HTTPS habilitado
- [ ] CORS configurado
- [ ] Rate limiting implementado
- [ ] Headers de seguridad (Helmet)
- [ ] Validación de inputs (Joi/Zod)
- [ ] Sanitización contra XSS
- [ ] MongoDB con autenticación
- [ ] Logs de seguridad activos
- [ ] Dependencias actualizadas (`npm audit`)

---

## 📞 Contacto

Para consultas de seguridad:
- Email: **[TU EMAIL]**
- GitHub: [@leonardostore389-tech](https://github.com/leonardostore389-tech)

---

**Última actualización:** Febrero 2025  
**Versión:** 1.0.0
