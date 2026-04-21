const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['adult', 'child'],
    default: 'adult'
  },
  age: {
    type: Number,
    min: 0,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
