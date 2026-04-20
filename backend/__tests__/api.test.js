const request = require('supertest');

// Mock the auth middleware BEFORE importing the app
jest.mock('../middleware/auth', () => {
    return (req, res, next) => {
        req.user = { uid: 'test_user_123', name: 'Test User' };
        next();
    };
});

// Mock the models
jest.mock('../models/User');
jest.mock('../models/Watchlist');
jest.mock('../models/Preference');

const app = require('../app');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const Preference = require('../models/Preference');
const tmdbService = require('../tmdbService');

// Mock tmdbService
jest.mock('../tmdbService', () => ({
    getGenres: jest.fn(),
    getProviders: jest.fn(),
    discoverMovies: jest.fn(),
    getRecommendationsForLikedMovies: jest.fn(),
    getMovieDetails: jest.fn(),
    getCertifications: jest.fn()
}));

describe('MovieNight API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/genres', () => {
        it('should return a list of genres', async () => {
            const mockGenres = [{ id: 28, name: 'Action' }];
            tmdbService.getGenres.mockResolvedValue(mockGenres);

            const res = await request(app).get('/api/genres');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockGenres);
        });
    });

    describe('Profile Endpoints (/api/user/profile)', () => {
        it('should return default profile if none exists', async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app).get('/api/user/profile');
            expect(res.status).toBe(200);
            expect(res.body.type).toBe('adult');
        });

        it('should update user profile', async () => {
            User.findOneAndUpdate.mockResolvedValue({
                name: 'Alice',
                type: 'adult',
                age: null,
                updatedAt: new Date()
            });

            const res = await request(app)
                .post('/api/user/profile')
                .send({ name: 'Alice', type: 'adult', age: null });
            
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Alice');
        });
    });

    describe('Preferences Endpoints', () => {
        it('should insert preference using auth uid', async () => {
            Preference.findOneAndUpdate.mockResolvedValue({ success: true });

            const res = await request(app)
                .post('/api/preferences')
                .send({ movieId: 123, preference: 'like' });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Watchlist Endpoints', () => {
        it('should get watchlist for auth user', async () => {
            Watchlist.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });
            const res = await request(app).get('/api/watchlist');
            expect(res.status).toBe(200);
        });

        it('should add to watchlist', async () => {
            Watchlist.findOneAndUpdate.mockResolvedValue({ success: true });
            const res = await request(app).post('/api/watchlist').send({ movieId: 123 });
            expect(res.status).toBe(200);
        });

        it('should delete from watchlist', async () => {
            Watchlist.findOneAndDelete.mockResolvedValue({ success: true });
            const res = await request(app).delete('/api/watchlist/123');
            expect(res.status).toBe(200);
        });
    });

    describe('Date Night Endpoint', () => {
        it('should return matched recommendations', async () => {
            Preference.find.mockResolvedValue([
                { userId: 'test_user_123', movieId: 10, preference: 'like' },
                { userId: 'user_2', movieId: 20, preference: 'like' }
            ]);

            tmdbService.getRecommendationsForLikedMovies = jest.fn()
                .mockResolvedValueOnce([{ id: 100, popularity: 5 }]) // user 1 recs
                .mockResolvedValueOnce([{ id: 100, popularity: 5 }]); // user 2 recs

            const res = await request(app).get('/api/date-night?user2=user_2');
            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(100);
        });
    });
});
