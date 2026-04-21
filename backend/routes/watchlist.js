const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res, next) => {
    const ownerId = req.user.uid;
    const profileId = req.headers['x-profile-id'] || ownerId;
    
    try {
        const watchlist = await Watchlist.find({ ownerId, profileId }).sort({ timestamp: -1 });
        res.json(watchlist.map(item => ({
            movieId: item.movieId,
            timestamp: item.timestamp
        })));
    } catch (error) {
        next(error);
    }
});

router.post('/',
    body('movieId').isInt(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const ownerId = req.user.uid;
        const profileId = req.headers['x-profile-id'] || ownerId;
        const { movieId } = req.body;
        
        try {
            await Watchlist.findOneAndUpdate(
                { ownerId, profileId, movieId: parseInt(movieId) },
                { ownerId, profileId, movieId: parseInt(movieId), timestamp: new Date() },
                { upsert: true, new: true }
            );
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }
);

router.delete('/:movieId', async (req, res, next) => {
    try {
        const ownerId = req.user.uid;
        const profileId = req.headers['x-profile-id'] || ownerId;
        const { movieId } = req.params;
        await Watchlist.findOneAndDelete({ ownerId, profileId, movieId: parseInt(movieId) });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
