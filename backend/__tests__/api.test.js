const request = require('supertest');

// Mock the auth middleware BEFORE importing the app
jest.mock('../middleware/auth', () => {
    return (req, res, next) => {
        req.user = { uid: 'test_owner_123', name: 'Test Owner' };
        next();
    };
});

// Mock the models
jest.mock('../models/Profile', () => {
    return jest.fn().mockImplementation((data) => ({
        ...data,
        _id: 'mock_id_123',
        save: jest.fn().mockResolvedValue(true)
    }));
});
const Profile = require('../models/Profile');
Profile.find = jest.fn();
Profile.findOne = jest.fn();
Profile.findOneAndUpdate = jest.fn();
Profile.findOneAndDelete = jest.fn();

jest.mock('../models/Watchlist', () => ({
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
}));
jest.mock('../models/Preference', () => ({
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
}));

const app = require('../app');
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

    describe('GET /api/movies/genres', () => {
        it('should return a list of genres', async () => {
            const mockGenres = [{ id: 28, name: 'Action' }];
            tmdbService.getGenres.mockResolvedValue(mockGenres);

            const res = await request(app).get('/api/movies/genres');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockGenres);
        });
    });

    describe('Profile Endpoints (/api/users)', () => {
        it('should return default profile if none exists for /profile', async () => {
            Profile.findOne.mockResolvedValue(null);

            const res = await request(app).get('/api/users/profile');
            expect(res.status).toBe(200);
            expect(res.body.name).toBeDefined();
        });

        it('should get all profiles for owner', async () => {
            Profile.find.mockResolvedValue([{ _id: 'p1', name: 'Mike' }, { _id: 'p2', name: 'Iris' }]);
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it('should create a new household profile', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Jackson', type: 'child', age: 8 });
            
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Jackson');
        });
    });

    describe('Preferences Endpoints', () => {
        it('should insert preference using ownerId and profileId', async () => {
            Preference.findOneAndUpdate.mockResolvedValue({ success: true });

            const res = await request(app)
                .post('/api/preferences')
                .set('x-profile-id', 'p123')
                .send({ movieId: 123, preference: 'like' });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Preference.findOneAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ ownerId: 'test_owner_123', profileId: 'p123', movieId: 123 }),
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('Watchlist Endpoints', () => {
        it('should get watchlist for specific profile', async () => {
            Watchlist.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });
            const res = await request(app)
                .get('/api/watchlist')
                .set('x-profile-id', 'p123');
            
            expect(res.status).toBe(200);
            expect(Watchlist.find).toHaveBeenCalledWith(
                expect.objectContaining({ ownerId: 'test_owner_123', profileId: 'p123' })
            );
        });
    });

    describe('Recommendations & Date Night', () => {
        it('should return matched recommendations for Date Night', async () => {
            Preference.find.mockResolvedValue([
                { ownerId: 'test_owner_123', profileId: 'p1', movieId: 10, preference: 'like' },
                { ownerId: 'test_owner_123', profileId: 'p2', movieId: 20, preference: 'like' }
            ]);

            tmdbService.getRecommendationsForLikedMovies
                .mockResolvedValueOnce([{ id: 100, popularity: 5 }]) // p1 recs
                .mockResolvedValueOnce([{ id: 100, popularity: 5 }]); // p2 recs

            const res = await request(app)
                .get('/api/date-night?user1=p1&user2=p2');
            
            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(100);
        });

        it('should return personal recommendations', async () => {
            Preference.find.mockResolvedValueOnce([{ movieId: 10, preference: 'like' }]); // liked
            Preference.find.mockResolvedValueOnce([]); // disliked
            tmdbService.getRecommendationsForLikedMovies.mockResolvedValue([{ id: 200, name: 'Rec Movie' }]);

            const res = await request(app)
                .get('/api/recommendations')
                .set('x-profile-id', 'p1');
            
            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(200);
        });
    });
});
