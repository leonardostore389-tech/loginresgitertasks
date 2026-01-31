const Mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require("../auth/generateTokens");
const { getUserInfo } = require("../lib/getUserInfo");
const Token = require("../schema/tokens");

const UserSchema = new Mongoose.Schema({
    id: { type: Object },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
});

// SIN next como parámetro - Mongoose 6+ no lo usa
UserSchema.pre('save', async function() {
    console.log("🔵 Middleware ejecutándose..."); // DEBUG
    
    if (this.isModified('password') || this.isNew) {
        console.log("🔵 Hasheando password..."); // DEBUG
        
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            console.log("✅ Hash generado:", this.password.substring(0, 20) + "..."); // DEBUG
        } catch (err) {
            console.log("❌ Error:", err); // DEBUG
            throw err;
        }
    } else {
        console.log("🔵 Password no modificado"); // DEBUG
    }
});
//si yo ingreso un nombre de usaurio que ya existe
//metodos
//validar el nombre de usaurio ya esxiste
UserSchema.methods.usernameExist = async function (username) {
    const result = await Mongoose.model("User").find({ username });//findOne
    return result.length > 0;  //return !!result ;
};
//comparar el password para el login
UserSchema.methods.comparePassword = async function (password, hash) {
    const same = await bcrypt.compare(password, hash);
    return same;

};
//los token
UserSchema.methods.createAccessToken = function () {
    return generateAccessToken(getUserInfo(this));//hace referencia usuario actual

};

UserSchema.methods.createRefreshToken = async function () {
    const refreshToken = generateRefreshToken(getUserInfo(this));
    try{
        await new Token({token : refreshToken}).save();
        return refreshToken;
    }catch(error){
        console.log(error);
    }
};

module.exports = Mongoose.model("User", UserSchema);
