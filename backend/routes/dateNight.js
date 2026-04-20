const express = require('express');
const router = express.Router();
const db = require('../database');
const tmdbService = require('../tmdbService');

router.get('/', async (req, res, next) => {
    const user1 = req.query.user1;
    const user2 = req.query.user2;
    if (!user1 || !user2) return res.status(400).json({ error: "user1 and user2 required" });

    try {
        // Fetch preferences for both users
        const pref1Snapshot = await db.collection('UserPreferences').where('userId', '==', user1).get();
        const pref2Snapshot = await db.collection('UserPreferences').where('userId', '==', user2).get();
        
        const allPreferences = [];
        pref1Snapshot.forEach(doc => allPreferences.push(doc.data()));
        pref2Snapshot.forEach(doc => allPreferences.push(doc.data()));

        const dislikes = new Set(allPreferences.filter(p => p.preference === 'dislike').map(p => p.movieId));
        
        const likes1 = allPreferences.filter(p => p.preference === 'like' && p.userId === user1).map(p => p.movieId);
        const likes2 = allPreferences.filter(p => p.preference === 'like' && p.userId === user2).map(p => p.movieId);
        
        if (likes1.length === 0 || likes2.length === 0) {
            return res.json([]); 
        }

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

module.exports = router;
