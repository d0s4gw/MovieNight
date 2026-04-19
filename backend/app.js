const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const db = require('./database');
const tmdbService = require('./tmdbService');
const path = require('path');

const app = express();

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for React static assets compatibility
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- TMDB Metadata Endpoints ---

app.get('/api/genres', async (req, res, next) => {
    try {
        const genres = await tmdbService.getGenres();
        res.json(genres);
    } catch (err) {
        next(err);
    }
});

app.get('/api/providers', async (req, res, next) => {
    try {
        const providers = await tmdbService.getProviders();
        res.json(providers);
    } catch (err) {
        next(err);
    }
});

app.get('/api/certifications', (req, res) => {
    res.json(["G", "PG", "PG-13", "R", "NC-17"]);
});

// --- Movie Discovery Endpoint ---

app.get('/api/movies', async (req, res, next) => {
    try {
        const results = await tmdbService.discoverMovies(req.query);
        res.json(results);
    } catch (err) {
        next(err);
    }
});

// --- Users Endpoints ---

app.get('/api/users', (req, res, next) => {
    db.all("SELECT * FROM Users", [], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

app.post('/api/users', 
    body('name').isString().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        db.run("INSERT INTO Users (name, type, age) VALUES (?, ?, ?)", [name, type, age], function(err) {
            if (err) return next(err);
            res.json({ id: this.lastID, name, type, age });
        });
    }
);

app.put('/api/users/:id', 
    body('name').isString().notEmpty(),
    body('type').isIn(['adult', 'child']),
    body('age').optional({ nullable: true }).isInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, type, age } = req.body;
        db.run("UPDATE Users SET name = ?, type = ?, age = ? WHERE id = ?", [name, type, age, req.params.id], function(err) {
            if (err) return next(err);
            res.json({ success: true });
        });
    }
);

app.delete('/api/users/:id', (req, res, next) => {
    db.run("DELETE FROM Users WHERE id = ?", [req.params.id], function(err) {
        if (err) return next(err);
        res.json({ success: true });
    });
});

// --- User Preferences Endpoints ---

app.get('/api/preferences', (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    db.all("SELECT * FROM UserPreferences WHERE userId = ?", [userId], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

// Validated endpoint
app.post('/api/preferences', 
    body('userId').isInt().withMessage('userId must be an integer'),
    body('movieId').isInt().withMessage('movieId must be an integer'),
    body('preference').isIn(['like', 'dislike']).withMessage('preference must be like or dislike'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, movieId, preference } = req.body;
        const fallbackSql = `INSERT OR REPLACE INTO UserPreferences (userId, movieId, preference, timestamp) 
                             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
        db.run(fallbackSql, [userId, movieId, preference], function(err) {
            if (err) return next(err);
            res.json({ success: true });
        });
    }
);

// --- Recommendations Endpoint ---

app.get('/api/recommendations', (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });

    db.all("SELECT movieId, preference FROM UserPreferences WHERE userId = ?", [userId], async (err, preferences) => {
        if (err) return next(err);

        const likedIds = preferences.filter(p => p.preference === 'like').map(p => p.movieId);
        const dislikedIds = preferences.filter(p => p.preference === 'dislike').map(p => p.movieId);
        const seenIds = [...likedIds, ...dislikedIds];

        if (likedIds.length === 0) {
            return res.json([]); 
        }

        try {
            const recommendations = await tmdbService.getRecommendationsForLikedMovies(likedIds);
            const unseenRecs = recommendations.filter(r => !seenIds.includes(r.id));
            res.json(unseenRecs);
        } catch (error) {
            next(error);
        }
    });
});

// Catch-all route to serve React App for any non-API route
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

module.exports = app;
