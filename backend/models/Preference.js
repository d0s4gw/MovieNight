const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  movieId: {
    type: Number,
    required: true
  },
  preference: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure uniqueness per user-movie combo
preferenceSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Preference', preferenceSchema);
