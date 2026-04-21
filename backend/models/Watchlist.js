const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  profileId: {
    type: String,
    required: true,
    index: true
  },
  movieId: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure uniqueness per profile-movie combo
watchlistSchema.index({ profileId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
