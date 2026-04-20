const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    
    try {
        const snapshot = await db.collection('UserPreferences').where('userId', '==', userId).get();
        const preferences = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            preferences.push({ movieId: data.movieId, preference: data.preference });
        });
        res.json(preferences);
    } catch (error) {
        next(error);
    }
});

router.post('/',
    body('userId').notEmpty(),
    body('movieId').isInt(),
    body('preference').isIn(['like', 'dislike']),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { userId, movieId, preference } = req.body;
        
        try {
            // Using composite key for the document ID ensures uniqueness per user-movie combo
            const docId = `${userId}_${movieId}`;
            await db.collection('UserPreferences').doc(docId).set({
                userId,
                movieId: parseInt(movieId),
                preference,
                timestamp: new Date().toISOString()
            });
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
