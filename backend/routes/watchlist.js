const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    
    try {
        const snapshot = await db.collection('Watchlist')
                                 .where('userId', '==', userId)
                                 .orderBy('timestamp', 'desc')
                                 .get();
        const watchlist = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            watchlist.push({ movieId: data.movieId, timestamp: data.timestamp });
        });
        res.json(watchlist);
    } catch (error) {
        next(error);
    }
});

router.post('/',
    body('userId').notEmpty(),
    body('movieId').isInt(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { userId, movieId } = req.body;
        
        try {
            const docId = `${userId}_${movieId}`;
            await db.collection('Watchlist').doc(docId).set({
                userId,
                movieId: parseInt(movieId),
                timestamp: new Date().toISOString()
            });
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }
);

router.delete('/:userId/:movieId', async (req, res, next) => {
    try {
        const { userId, movieId } = req.params;
        const docId = `${userId}_${movieId}`;
        await db.collection('Watchlist').doc(docId).delete();
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
