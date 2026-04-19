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

function getCachedData(key) {
    return new Promise((resolve, reject) => {
        db.get("SELECT value, timestamp FROM Cache WHERE key = ?", [key], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            
            const age = Date.now() - new Date(row.timestamp).getTime();
            if (age > CACHE_TTL) {
                // Expired
                db.run("DELETE FROM Cache WHERE key = ?", [key]);
                return resolve(null);
            }
            resolve(JSON.parse(row.value));
        });
    });
}

function setCachedData(key, value) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT OR REPLACE INTO Cache (key, value, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)`;
        db.run(sql, [key, JSON.stringify(value)], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
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
        page: 1,
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
        const searchParams = { query: filters.searchQuery, language: 'en-US', page: 1, include_adult: false };
        const searchData = await fetchFromTMDB('/search/movie', searchParams);
        // TMDB search endpoint doesn't support complex filtering (like with_watch_providers), 
        // so we might just return the raw search results for simplicity when searching by name
        return searchData.results;
    }

    const data = await fetchFromTMDB('/discover/movie', params);
    return data.results;
}

async function getRecommendationsForLikedMovies(likedMovieIds) {
    if (!likedMovieIds || likedMovieIds.length === 0) return [];

    // TMDB allows getting recommendations per movie. 
    // We will fetch recommendations for the last 3 liked movies concurrently.
    const recentLikes = likedMovieIds.slice(-3); 
    
    const fetchPromises = recentLikes.map(movieId => 
        fetchFromTMDB(`/movie/${movieId}/recommendations`, { language: 'en-US', page: 1 })
    );

    const results = await Promise.all(fetchPromises);
    
    const allRecs = results.flatMap(data => data.results);
    
    // Remove duplicates based on ID
    const uniqueRecs = Array.from(new Map(allRecs.map(item => [item.id, item])).values());
    
    // Sort by popularity
    uniqueRecs.sort((a, b) => b.popularity - a.popularity);
    return uniqueRecs.slice(0, 20); // Return top 20
}

module.exports = {
    getGenres,
    getProviders,
    discoverMovies,
    getRecommendationsForLikedMovies
};
