require('dotenv').config();
const axios = require('axios');
const Cache = require('./models/Cache');
const logger = require('./utils/logger');

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_ACCESS_TOKEN) {
    logger.error('CRITICAL: TMDB_ACCESS_TOKEN is not set. TMDB API calls will fail.');
}

const tmdbApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Cache duration: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000; 

async function getCachedData(key) {
    try {
        const cached = await Cache.findOne({ key });
        
        if (!cached) return null;
        
        const age = Date.now() - new Date(cached.timestamp).getTime();
        
        if (age > CACHE_TTL) {
            // Expired
            await Cache.deleteOne({ key });
            return null;
        }
        
        return JSON.parse(cached.value);
    } catch (error) {
        logger.error({ err: error, key }, 'Error reading from cache');
        return null;
    }
}

async function setCachedData(key, value) {
    try {
        await Cache.findOneAndUpdate(
            { key },
            { 
                key,
                value: JSON.stringify(value),
                timestamp: new Date()
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        logger.error({ err: error, key }, 'Error writing to cache');
    }
}

async function fetchFromTMDB(endpoint, params = {}) {
    // create a deterministic cache key based on endpoint and params
    const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
    }, {});
    const cacheKey = `${endpoint}?${new URLSearchParams(sortedParams).toString()}`;
    
    try {
        const cached = await getCachedData(cacheKey);
        if (cached) return cached;

        logger.info({ cacheKey }, 'Cache miss, fetching from TMDB');
        const response = await tmdbApi.get(endpoint, { params });
        
        await setCachedData(cacheKey, response.data);
        return response.data;
    } catch (err) {
        logger.error({ err: err.message, endpoint }, 'Error fetching TMDB endpoint');
        throw err;
    }
}

async function getGenres() {
    const data = await fetchFromTMDB('/genre/movie/list');
    return data.genres;
}

async function getProviders() {
    const data = await fetchFromTMDB('/watch/providers/movie', { watch_region: 'US' });
    const targetProviderIds = [8, 9, 337, 384, 1899, 15, 2];
    const providers = data.results.filter(p => targetProviderIds.includes(p.provider_id));
    return providers;
}

async function discoverMovies(filters) {
    const params = {
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: false,
        page: filters.page || 1,
        watch_region: 'US'
    };

    if (filters.providers) params.with_watch_providers = filters.providers;
    if (filters.genres) params.with_genres = filters.genres;
    if (filters.minScore) params['vote_average.gte'] = filters.minScore;
    
    if (filters.ratings) {
        params.certification_country = 'US';
        params.certification = filters.ratings;
    }
    
    if (filters.searchQuery) {
        const searchParams = { query: filters.searchQuery, language: 'en-US', page: filters.page || 1, include_adult: false };
        const searchData = await fetchFromTMDB('/search/movie', searchParams);
        return searchData.results;
    }

    const data = await fetchFromTMDB('/discover/movie', params);
    return data.results;
}

async function getRecommendationsForLikedMovies(likedMovieIds) {
    if (!likedMovieIds || likedMovieIds.length === 0) return [];

    const recentLikes = likedMovieIds.slice(-3); 
    
    const fetchPromises = recentLikes.map(movieId => 
        fetchFromTMDB(`/movie/${movieId}/recommendations`, { language: 'en-US', page: 1 })
    );

    const results = await Promise.all(fetchPromises);
    
    const allRecs = results.flatMap(data => data.results);
    
    const uniqueRecs = Array.from(new Map(allRecs.map(item => [item.id, item])).values());
    
    uniqueRecs.sort((a, b) => b.popularity - a.popularity);
    return uniqueRecs.slice(0, 20);
}

async function getMovieDetails(movieId) {
    return await fetchFromTMDB(`/movie/${movieId}`, { append_to_response: 'videos,credits,watch/providers' });
}

async function getMultipleMovies(movieIds) {
    const fetchPromises = movieIds.map(id => fetchFromTMDB(`/movie/${id}`));
    const results = await Promise.all(fetchPromises);
    return results;
}

module.exports = {
    getGenres,
    getProviders,
    discoverMovies,
    getRecommendationsForLikedMovies,
    getMovieDetails,
    getMultipleMovies
};
