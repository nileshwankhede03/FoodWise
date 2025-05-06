const mongoose=require('mongoose')
const recipeSchema = mongoose.Schema({
    name: String,
    ingredients: [{
        item: String,
        quantity: Number,
        unit: String
    }],
    instructions: [String],
    cookingTime: Number,
    difficulty: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', recipeSchema);