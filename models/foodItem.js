const mongoose = require('mongoose');

const foodItemSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    category: String,
    quantity: Number,
    unit: String,
    purchaseDate: Date,
    expiryDate: Date,
    status: {
        type: String,
        enum: ["active", "expired", "consumed", "donated"]
    },
    price: Number,
    discount: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FoodItem', foodItemSchema);