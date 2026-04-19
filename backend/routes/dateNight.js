const express = require('express');
const router = express.Router();
const db = require('../database');
const tmdbService = require('../tmdbService');

router.get('/', (req, res, next) => {
    const user1 = req.query.user1;
    const user2 = req.query.user2;
    if (!user1 || !user2) return res.status(400).json({ error: "user1 and user2 required" });

    db.all("SELECT userId, movieId, preference FROM UserPreferences WHERE userId IN (?, ?)", [user1, user2], async (err, preferences) => {
        if (err) return next(err);

        const dislikes = new Set(preferences.filter(p => p.preference === 'dislike').map(p => p.movieId));
        
        const likes1 = preferences.filter(p => p.preference === 'like' && p.userId == user1).map(p => p.movieId);
        const likes2 = preferences.filter(p => p.preference === 'like' && p.userId == user2).map(p => p.movieId);
        
        if (likes1.length === 0 || likes2.length === 0) {
            return res.json([]); 
        }

        try {
            const recs1 = await tmdbService.getRecommendationsForLikedMovies(likes1);
            const recs2 = await tmdbService.getRecommendationsForLikedMovies(likes2);
            
            // Score by occurrences and popularity
            const movieMap = new Map();
            const processRecs = (recs) => {
                recs.forEach(r => {
                    if (dislikes.has(r.id)) return;
                    if (movieMap.has(r.id)) {
                        movieMap.get(r.id).score += 1; // It appeared in both users' recs
                    } else {
                        movieMap.set(r.id, { ...r, score: 1 });
                    }
                });
            };
            
            processRecs(recs1);
            processRecs(recs2);
            
            const matchedRecs = Array.from(movieMap.values())
                .filter(m => m.score > 1) // Prioritize movies recommended to BOTH users
                .sort((a, b) => b.popularity - a.popularity);
                
            res.json(matchedRecs.slice(0, 20));
        } catch (error) {
            next(error);
        }
    });
});

module.exports = router;
