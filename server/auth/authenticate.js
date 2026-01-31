const { jsonResponse } = require("../lib/jsonResponse");
const getTokenFromHeader = require("./getTokenFromHeader");
const { verifyAccessToken, verifyRefreshToken } = require("./verifyTokens");
function authenticate(req, res, next) {
  const token = getTokenFromHeader(req.headers);
  
  if (token) {
    // Aquí debería ir la lógica de verificación del token
    // Por ejemplo:
    // try {
    const decoded = verifyAccessToken(token);
    if(decoded){
        req.user = { ...decoded.user };
        next();
    }else{
        res.status(401).json(
      jsonResponse(401, {
        message: "No token provided",
      })
    );
    }
    //   
    //   next();
    // } catch (error) {
    //   res.status(401).json(jsonResponse(401, { message: "Invalid token" }));
    // }
  } else {
    res.status(401).json(
      jsonResponse(401, {
        message: "No token provided",
      })
    );
  }
}

module.exports = authenticate;