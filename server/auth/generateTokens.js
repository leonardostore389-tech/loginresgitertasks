const jwt = require("jsonwebtoken");

// Función para firmar tokens JWT
function sign(payload, isAccessToken) {
    return jwt.sign(
        payload,
        isAccessToken
            ? process.env.ACCESS_TOKEN_SECRET
            : process.env.REFRESH_TOKEN_SECRET,
        {
            algorithm: "HS256",
            expiresIn: 3600, // ⬅️ Faltaba poner esto dentro del objeto options
        }
    );
}

// Generar Access Token (token de acceso)
function generateAccessToken(user) {
    return sign({ user }, true);
}

// Generar Refresh Token (token de refresco)
function generateRefreshToken(user) {
    return sign({ user }, false);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
};