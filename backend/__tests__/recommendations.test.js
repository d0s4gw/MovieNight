const request = require('supertest');
const app = require('../app');
const Preference = require('../models/Preference');
const tmdbService = require('../tmdbService');

// Mock auth
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { uid: 'test_owner_123' };
    next();
});

// Mock models
jest.mock('../models/Preference', () => ({
    find: jest.fn()
}));

// Mock tmdbService
jest.mock('../tmdbService', () => ({
    getRecommendationsForLikedMovies: jest.fn(),
    getGenres: jest.fn(),
    getProviders: jest.fn(),
    getCertifications: jest.fn()
}));

describe('Recommendations Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return empty array if no liked movies exist', async () => {
        Preference.find.mockResolvedValue([]); // No likes

        const res = await request(app).get('/api/recommendations');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
        expect(tmdbService.getRecommendationsForLikedMovies).not.toHaveBeenCalled();
    });

    it('should filter out disliked movies from recommendations', async () => {
        Preference.find
            .mockResolvedValueOnce([{ movieId: 1, preference: 'like' }]) // liked
            .mockResolvedValueOnce([{ movieId: 100, preference: 'dislike' }]); // disliked

        tmdbService.getRecommendationsForLikedMovies.mockResolvedValue([
            { id: 100, title: 'Disliked Movie' },
            { id: 200, title: 'Good Movie' }
        ]);

        const res = await request(app).get('/api/recommendations');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(200);
    });

    it('should handle TMDB service errors gracefully', async () => {
        Preference.find.mockResolvedValue([{ movieId: 1, preference: 'like' }]);
        tmdbService.getRecommendationsForLikedMovies.mockRejectedValue(new Error('TMDB Down'));

        const res = await request(app).get('/api/recommendations');
        expect(res.status).toBe(500);
        expect(res.body.error).toBeDefined();
    });
});
