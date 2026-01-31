const router = require("express").Router();
const { getUserInfo } = require("../lib/getUserInfo");
const { jsonResponse } = require("../lib/jsonResponse");
const User = require("../schema/user");
router.post("/" ,async (req,res) => {
    const {username ,password } = req.body;
    
        if(!username || !password){
            console.log("Campos faltantes");
            return res.status(400).json(jsonResponse(400 , {
                error :"Field are required- login",
            }));
        }

        const user = await User.findOne({username});
        if(user){
            //comaprar password-hash
            const correctPassword = await user.comparePassword( password, user.password);
            if(correctPassword){
                //autenticar usuario en la  base de datos
                const accessToken =user.createAccessToken();
                const refreshToken =await user.createRefreshToken();
                res.status(200).json(jsonResponse(200,{user:getUserInfo(user) , accessToken , refreshToken}));
            }else{
                res.status(400).json(jsonResponse(400,
                {error :"User or password is incorrect" }));

            }
        }else {
            res.status(400).json(jsonResponse(400,
                {error :"User not found" }));

        }

    
        
        
        /* const user = {
            id:'1',
            name:'John Doe',
            username :'XXXXXX'
        }*/
        
    //res.send("login");
});

module.exports = router;