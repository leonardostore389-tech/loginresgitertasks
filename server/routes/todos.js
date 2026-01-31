const router = require("express").Router();
const Todo = require("../schema/todo"); // Asumiendo que tienes un modelo

router.get("/", async (req, res) => {
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (error) {
        console.error("❌ Error al obtener todos:", error);
        res.status(500).json({
            error: "Error al obtener todos"
        });
    }
});

router.post("/", async (req, res) => {
    if(!req.body.title){
        res.status(400).json({
                error: "El título es requerido"
            });
    }
    try {
        
        const todo = new Todo({
            title : req.body.title,
            completed:false ,
            idUser :req.user.id,
        });
        
        const newTodo =  await todo.save();
        
        res.status(201).json(newTodo);
        
    } catch (error) {
        console.error("❌ Error al crear todo:", error);
        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// Eliminar un todo
router.delete("/:id", async (req, res) => {
    try {
        const todo = await Todo.findOne({ 
            _id: req.params.id, 
            idUser: req.user.id 
        });
        
        if (!todo) {
            return res.status(404).json({
                error: "Todo no encontrado"
            });
        }
        
        await Todo.deleteOne({ _id: req.params.id });
        
        res.json({
            message: "Todo eliminado exitosamente",
            id: req.params.id
        });
        
    } catch (error) {
        console.error("❌ Error al eliminar todo:", error);
        res.status(500).json({
            error: "Error al eliminar todo"
        });
    }
});

module.exports = router;