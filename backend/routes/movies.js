const express = require('express');
const router = express.Router();
const tmdbService = require('../tmdbService');

router.get('/genres', async (req, res, next) => {
    try {
        const genres = await tmdbService.getGenres();
        res.json(genres);
    } catch (err) {
        next(err);
    }
});

router.get('/providers', async (req, res, next) => {
    try {
        const providers = await tmdbService.getProviders();
        res.json(providers);
    } catch (err) {
        next(err);
    }
});

router.get('/certifications', (req, res) => {
    res.json(["G", "PG", "PG-13", "R", "NC-17"]);
});

router.get('/', async (req, res, next) => {
    try {
        const results = await tmdbService.discoverMovies(req.query);
        res.json(results);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const details = await tmdbService.getMovieDetails(req.params.id);
        res.json(details);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
