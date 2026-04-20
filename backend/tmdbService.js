require('dotenv').config();
const axios = require('axios');
const db = require('./database');

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

const tmdbApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Cache duration: 24 hours for most things
const CACHE_TTL = 24 * 60 * 60 * 1000; 

async function getCachedData(key) {
    if (!db) return null; // Fallback if db is not initialized (e.g., in tests without emulator)
    
    // Firestore keys cannot contain certain characters like '?' or '/'. We will hash it or base64 encode it.
    // However, since it's just a cache key, base64 is easy and safe.
    const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
    
    try {
        const docRef = db.collection('Cache').doc(safeKey);
        const doc = await docRef.get();
        
        if (!doc.exists) return null;
        
        const data = doc.data();
        const age = Date.now() - new Date(data.timestamp).getTime();
        
        if (age > CACHE_TTL) {
            // Expired
            await docRef.delete();
            return null;
        }
        
        return JSON.parse(data.value);
    } catch (error) {
        console.error('Error reading from cache:', error.message);
        return null;
    }
}

async function setCachedData(key, value) {
    if (!db) return;
    
    const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
    
    try {
        await db.collection('Cache').doc(safeKey).set({
            key: key, // Store original key for reference
            value: JSON.stringify(value),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error writing to cache:', error.message);
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

        console.log(`Cache miss for ${cacheKey}, fetching from TMDB...`);
        const response = await tmdbApi.get(endpoint, { params });
        
        await setCachedData(cacheKey, response.data);
        return response.data;
    } catch (err) {
        console.error(`Error fetching TMDB endpoint ${endpoint}:`, err.message);
        throw err;
    }
}

async function getGenres() {
    const data = await fetchFromTMDB('/genre/movie/list');
    return data.genres;
}

async function getProviders() {
    const data = await fetchFromTMDB('/watch/providers/movie', { watch_region: 'US' });
    // Filter to some major US providers to keep the list clean (Netflix, Amazon, Disney+, HBO Max/Max, Hulu, Apple TV+)
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
    
    // Certifications (Ratings like PG-13) are slightly complex in TMDB, needs certification_country
    if (filters.ratings) {
        params.certification_country = 'US';
        params.certification = filters.ratings;
    }
    
    if (filters.searchQuery) {
        // If there's a search query, we must use the /search/movie endpoint instead
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
