const mongoose=require('mongoose')
const foodItem = require('./foodItem')
mongoose.connect('mongodb://localhost:27017/Foodforneed')

const userSchema=mongoose.Schema({
    name: String,
    email: String,
    password: String,
    userType: {
        type: String,
        enum: ["individual", "restaurant", "store", "foodbank"]
    },
    contact: String,
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    foodItem:[{
        type:mongoose.Schema.Types.ObjectId,ref:foodItem
    }],
    donationPoints: Number,
    createdAt: { type: Date, default: Date.now }
})
module.exports=mongoose.model('user',userSchema)
