// models/Donation.js
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true
  },
  contactno:{
    type:String
  },
  userType:{
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  
  foodName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  }, 
  
  address:{
    type:String,required:true
  },
  coordinates: {
    type: {
      latitude: Number,
      longitude: Number
    },
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'reserved', 'collected', 'take for compost', 'composted'],
    default: 'active'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', donationSchema);
