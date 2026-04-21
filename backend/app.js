const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const Preference = require('./models/Preference');
const tmdbService = require('./tmdbService');

const moviesRouter = require('./routes/movies');
const usersRouter = require('./routes/users');
const preferencesRouter = require('./routes/preferences');
const watchlistRouter = require('./routes/watchlist');
const dateNightRouter = require('./routes/dateNight');

const requireAuth = require('./middleware/auth');

const app = express();

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false })); 
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Apply auth to all API routes
app.use('/api', (req, res, next) => {
    requireAuth(req, res, next);
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- Routes ---
app.use('/api/movies', moviesRouter);

// Metadata endpoints
app.use('/api/genres', (req, res, next) => { req.url = '/genres'; moviesRouter(req, res, next); });
app.use('/api/providers', (req, res, next) => { req.url = '/providers'; moviesRouter(req, res, next); });
app.use('/api/certifications', (req, res, next) => { req.url = '/certifications'; moviesRouter(req, res, next); });

app.use('/api/users', usersRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/date-night', dateNightRouter);

// Recommendations endpoint
app.get('/api/recommendations', async (req, res, next) => {
    const ownerId = req.user.uid;
    const profileId = req.headers['x-profile-id'] || ownerId;

    try {
        const likedPrefs = await Preference.find({ ownerId, profileId, preference: 'like' });
        
        if (likedPrefs.length === 0) {
            return res.json([]); 
        }

        const likedIds = likedPrefs.map(p => p.movieId);
        const recommendations = await tmdbService.getRecommendationsForLikedMovies(likedIds);
        
        const dislikedPrefs = await Preference.find({ ownerId, profileId, preference: 'dislike' });
        const dislikedIds = new Set(dislikedPrefs.map(p => p.movieId));

        const filteredRecs = recommendations.filter(movie => !dislikedIds.has(movie.id));
        res.json(filteredRecs);
    } catch (error) {
        next(error);
    }
});

// Catch-all route to serve React App
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error({ err, stack: err.stack }, 'Unhandled Error');
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

module.exports = app;
