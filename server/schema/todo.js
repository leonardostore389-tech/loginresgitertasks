const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
    // ❌ No necesitas 'id' porque MongoDB crea automáticamente '_id'
    id : {type :Object },
   
    idUser: { 
        type: String ,
        ref: 'User',
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    completed: { 
        type: Boolean, 
        default: false  // ✅ Mejor usar default en lugar de required
    },
}, {
    timestamps: true  // ✅ Agrega createdAt y updatedAt automáticamente
});

module.exports = mongoose.model("Todo", TodoSchema);