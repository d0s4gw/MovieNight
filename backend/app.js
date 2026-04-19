const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const moviesRouter = require('./routes/movies');
const usersRouter = require('./routes/users');
const preferencesRouter = require('./routes/preferences');
const watchlistRouter = require('./routes/watchlist');
const dateNightRouter = require('./routes/dateNight');

const app = express();

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for React static assets compatibility
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- Routes ---
app.use('/api/movies', moviesRouter);

// Maintain backwards compatibility for existing metadata endpoints by routing them through movies router
app.use('/api/genres', (req, res, next) => { req.url = '/genres'; moviesRouter(req, res, next); });
app.use('/api/providers', (req, res, next) => { req.url = '/providers'; moviesRouter(req, res, next); });
app.use('/api/certifications', (req, res, next) => { req.url = '/certifications'; moviesRouter(req, res, next); });

app.use('/api/users', usersRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/date-night', dateNightRouter);

// Recommendations endpoint
const db = require('./database');
const tmdbService = require('./tmdbService');

app.get('/api/recommendations', (req, res, next) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });

    db.all("SELECT movieId FROM UserPreferences WHERE userId = ? AND preference = 'like'", [userId], async (err, rows) => {
        if (err) return next(err);
        
        if (rows.length === 0) {
            return res.json([]); 
        }

        const likedIds = rows.map(r => r.movieId);
        try {
            const recommendations = await tmdbService.getRecommendationsForLikedMovies(likedIds);
            
            db.all("SELECT movieId FROM UserPreferences WHERE userId = ? AND preference = 'dislike'", [userId], (err, dislikeRows) => {
                if (err) return next(err);
                
                const dislikedIds = new Set(dislikeRows.map(r => r.movieId));
                const filteredRecs = recommendations.filter(movie => !dislikedIds.has(movie.id));
                
                res.json(filteredRecs);
            });
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
