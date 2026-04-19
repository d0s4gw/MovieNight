const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, validationResult } = require('express-validator');

router.get('/', (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    db.all("SELECT movieId, timestamp FROM Watchlist WHERE userId = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

router.post('/',
    body('userId').isInt(),
    body('movieId').isInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { userId, movieId } = req.body;
        db.run("INSERT OR REPLACE INTO Watchlist (userId, movieId, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)", [userId, movieId], function(err) {
            if (err) return next(err);
            res.json({ success: true });
        });
    }
);

router.delete('/:userId/:movieId', (req, res, next) => {
    db.run("DELETE FROM Watchlist WHERE userId = ? AND movieId = ?", [req.params.userId, req.params.movieId], function(err) {
        if (err) return next(err);
        res.json({ success: true });
    });
});

module.exports = router;
