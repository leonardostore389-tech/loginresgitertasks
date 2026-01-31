const router = require("express").Router();
const { jsonResponse } = require("../lib/jsonResponse");
const User = require("../schema/user")
router.post("/" , async (req,res) => {
    const {username , name ,password } = req.body;
    
        if(!username || !name || !password){
            console.log("Campos faltantes");
            return res.status(400).json(jsonResponse(400 , {
                //crear un usuario   ESQUEMA
                error :"Field are required",
            }));
        }
        
        //crear usuario en la  base de datos
        //const user = new User({username,name,password});
        try {
        // Verificar si el usuario ya existe
        const user = new User();
        const exists = await user.usernameExist(username);
        
        if (exists) {
            return res.status(409).json(jsonResponse(409, {
                error: "Username already exists",
            }));
        }

        // Crear nuevo usuario
        const newUser = new User({ username, name, password });
        await newUser.save(); // ⬅️ IMPORTANTE: await aquí
        
        // Respuesta exitosa
        res.status(200).json(jsonResponse(200, { 
            message: "User created successfully" 
        }));

    } catch (error) {
        console.error("❌ Error al crear usuario:", error);
        // Error general
        res.status(500).json(jsonResponse(500, {
            error: "Error creating user",
            details: error.message
        }));
    }
        //user.save();
    
    //res.send("signup");
});

module.exports = router;