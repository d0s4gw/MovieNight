const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res, next) => {
    const userId = req.user.uid;
    
    try {
        const preferences = await Preference.find({ userId });
        res.json(preferences.map(item => ({
            movieId: item.movieId,
            preference: item.preference
        })));
    } catch (error) {
        next(error);
    }
});

router.post('/',
    body('movieId').isInt(),
    body('preference').isIn(['like', 'dislike']),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const userId = req.user.uid;
        const { movieId, preference } = req.body;
        
        try {
            await Preference.findOneAndUpdate(
                { userId, movieId: parseInt(movieId) },
                { userId, movieId: parseInt(movieId), preference, timestamp: new Date() },
                { upsert: true, new: true }
            );
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
