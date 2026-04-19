const request = require('supertest');
const app = require('../app');
const db = require('../database');
const tmdbService = require('../tmdbService');

// Mock dependencies
jest.mock('../database', () => ({
    all: jest.fn(),
    run: jest.fn(),
    get: jest.fn()
}));

jest.mock('../tmdbService', () => ({
    getGenres: jest.fn(),
    getProviders: jest.fn(),
    discoverMovies: jest.fn(),
    getRecommendationsForLikedMovies: jest.fn()
}));

describe('MovieNight API', () => {
    afterEach(() => {
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

    describe('GET /api/movies', () => {
        it('should pass query parameters to discoverMovies', async () => {
            const mockMovies = [{ id: 1, title: 'Inception' }];
            tmdbService.discoverMovies.mockResolvedValue(mockMovies);

            const res = await request(app).get('/api/movies?genres=28&minScore=8');
            expect(res.status).toBe(200);
            expect(tmdbService.discoverMovies).toHaveBeenCalledWith({ genres: '28', minScore: '8' });
            expect(res.body).toEqual(mockMovies);
        });
    });

    describe('POST /api/users', () => {
        it('should validate inputs and return 400 for bad type', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Bob', type: 'invalid_type', age: 10 });
            
            expect(res.status).toBe(400);
            expect(res.body.errors[0].msg).toBe('Invalid value');
        });

        it('should insert user and return their id', async () => {
            db.run.mockImplementation((sql, params, cb) => {
                cb.call({ lastID: 42 }, null);
            });

            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Alice', type: 'adult', age: null });
            
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(42);
            expect(res.body.name).toBe('Alice');
        });
    });

    describe('POST /api/preferences', () => {
        it('should validate inputs and insert preference', async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null));

            const res = await request(app)
                .post('/api/preferences')
                .send({ userId: 1, movieId: 123, preference: 'like' });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(db.run).toHaveBeenCalledTimes(1);
        });

        it('should return 400 for invalid preference string', async () => {
            const res = await request(app)
                .post('/api/preferences')
                .send({ userId: 1, movieId: 123, preference: 'love' });
            
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/movies/:id', () => {
        it('should return movie details', async () => {
            tmdbService.getMovieDetails = jest.fn().mockResolvedValue({ id: 1, title: 'Inception' });
            const res = await request(app).get('/api/movies/1');
            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Inception');
            expect(tmdbService.getMovieDetails).toHaveBeenCalledWith('1');
        });
    });

    describe('Watchlist Endpoints', () => {
        it('should require userId for GET', async () => {
            const res = await request(app).get('/api/watchlist');
            expect(res.status).toBe(400);
        });

        it('should add to watchlist', async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null));
            const res = await request(app).post('/api/watchlist').send({ userId: 1, movieId: 123 });
            expect(res.status).toBe(200);
        });

        it('should delete from watchlist', async () => {
            db.run.mockImplementation((sql, params, cb) => cb(null));
            const res = await request(app).delete('/api/watchlist/1/123');
            expect(res.status).toBe(200);
        });
    });

    describe('Date Night Endpoint', () => {
        it('should require user1 and user2', async () => {
            const res = await request(app).get('/api/date-night?user1=1');
            expect(res.status).toBe(400);
        });

        it('should return matched recommendations', async () => {
            db.all.mockImplementation((sql, params, cb) => {
                cb(null, [
                    { userId: 1, movieId: 10, preference: 'like' },
                    { userId: 2, movieId: 20, preference: 'like' }
                ]);
            });

            tmdbService.getRecommendationsForLikedMovies = jest.fn()
                .mockResolvedValueOnce([{ id: 100, popularity: 5 }]) // user 1 recs
                .mockResolvedValueOnce([{ id: 100, popularity: 5 }]); // user 2 recs

            const res = await request(app).get('/api/date-night?user1=1&user2=2');
            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(100);
        });
    });
});
