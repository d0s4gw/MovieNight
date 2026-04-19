const express = require('express');
const router = express.Router();
const db = require('../database');
const { body, validationResult } = require('express-validator');

router.get('/', (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    db.all("SELECT movieId, preference FROM UserPreferences WHERE userId = ?", [userId], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

router.post('/',
    body('userId').isInt(),
    body('movieId').isInt(),
    body('preference').isIn(['like', 'dislike']),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { userId, movieId, preference } = req.body;
        db.run("INSERT OR REPLACE INTO UserPreferences (userId, movieId, preference) VALUES (?, ?, ?)", 
            [userId, movieId, preference], 
            function(err) {
                if (err) return next(err);
                res.json({ success: true });
            }
        );
    }
);

module.exports = router;
