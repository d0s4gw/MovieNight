import React from 'react';
import MovieCard from '../MovieCard';

export default function WatchlistTab({
  watchlistMovies, preferences, watchlist,
  handlePreferenceChange, handleWatchlistChange,
  setSelectedMovieId, loading
}) {
  return (
    <main style={{ gridColumn: '1 / -1' }}>
      <div className="movie-grid">
        {watchlistMovies.map(movie => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            preferences={preferences} 
            watchlist={watchlist} 
            onPreferenceChange={handlePreferenceChange} 
            onWatchlistChange={handleWatchlistChange} 
            onSelectMovie={setSelectedMovieId} 
          />
        ))}
      </div>
      
      {watchlistMovies.length === 0 && !loading && (
        <div className="no-results glass">Your watchlist is empty. Find some movies to save!</div>
      )}
    </main>
  );
}
