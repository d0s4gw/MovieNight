import React from 'react';
import MovieCard from '../MovieCard';

export default function ForYouTab({
  recommendations, preferences, watchlist,
  handlePreferenceChange, handleWatchlistChange,
  setSelectedMovieId, loading, activeUser
}) {
  return (
    <main style={{ gridColumn: '1 / -1' }}>
      <div className="movie-grid">
        {recommendations.map(movie => (
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
      
      {recommendations.length === 0 && !loading && (
        <div className="no-results glass">
          Not enough data to make recommendations for {activeUser?.name}. Like some movies first!
        </div>
      )}
    </main>
  );
}
