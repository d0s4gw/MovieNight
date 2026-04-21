const tmdbService = require('../tmdbService');
const axios = require('axios');
const Cache = require('../models/Cache');

jest.mock('axios', () => {
    const mGet = jest.fn();
    return {
        create: jest.fn(() => ({ get: mGet })),
        __mockGet: mGet
    };
});

const mockGet = require('axios').__mockGet;

jest.mock('../models/Cache');

describe('tmdbService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('discoverMovies', () => {
        it('should return cache on cache hit', async () => {
            const mockCachedData = { results: [{ id: 1, title: 'Cached Movie' }] };
            Cache.findOne.mockResolvedValue({
                value: JSON.stringify(mockCachedData),
                timestamp: new Date()
            });

            const result = await tmdbService.discoverMovies({ minScore: 8 });
            expect(result[0].title).toBe('Cached Movie');
            expect(mockGet).not.toHaveBeenCalled();
        });

        it('should fetch from API on cache miss and save to cache', async () => {
            Cache.findOne.mockResolvedValue(null);
            Cache.findOneAndUpdate.mockResolvedValue({});
            
            mockGet.mockResolvedValue({ data: { results: [{ id: 2, title: 'API Movie' }] } });

            const result = await tmdbService.discoverMovies({ providers: '8|9' });
            expect(result[0].title).toBe('API Movie');
            expect(mockGet).toHaveBeenCalledWith('/discover/movie', expect.any(Object));
            expect(Cache.findOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe('getRecommendationsForLikedMovies', () => {
        it('should fetch recommendations concurrently', async () => {
            Cache.findOne.mockResolvedValue(null);
            Cache.findOneAndUpdate.mockResolvedValue({});

            // Setup mock to resolve successfully for any ID
            mockGet.mockResolvedValue({ data: { results: [{ id: 10, title: 'Rec 1' }] } });

            const result = await tmdbService.getRecommendationsForLikedMovies([100, 200, 300]);
            
            // Should have made exactly 3 calls
            expect(mockGet).toHaveBeenCalledTimes(3);
            expect(result.length).toBeGreaterThan(0);
        });
        
        it('should return empty array if no likes provided', async () => {
            const result = await tmdbService.getRecommendationsForLikedMovies([]);
            expect(result).toEqual([]);
        });
    });
});
