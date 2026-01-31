const getTokenFromHeader = require("../auth/getTokenFromHeader");
const { jsonResponse } = require("../lib/jsonResponse");
const Token = require("../schema/tokens");
const router = require("express").Router();

router.delete("/", async (req, res) => {
    try {
        const refreshToken = getTokenFromHeader(req.headers);
        
        if (refreshToken) {
            // ✅ Usar findOneAndDelete en lugar de findOneAndRemove
            await Token.findOneAndDelete({ token: refreshToken });
            
            res.status(200).json(
                jsonResponse(200, {
                    message: "Token deleted"
                })
            );
        } else {
            res.status(400).json(
                jsonResponse(400, {
                    error: "No refresh token provided"
                })
            );
        }
        
    } catch (error) {
        console.error("Error en signout:", error);
        return res.status(500).json(
            jsonResponse(500, {
                error: "Error al cerrar sesión"
            })
        );
    }
});

module.exports = router;