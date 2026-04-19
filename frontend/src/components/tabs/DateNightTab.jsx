import React from 'react';
import MovieCard from '../MovieCard';

export default function DateNightTab({
  dateNightMatches, preferences, watchlist,
  handlePreferenceChange, handleWatchlistChange,
  setSelectedMovieId, loading,
  users, dateUser1, setDateUser1, dateUser2, setDateUser2
}) {
  return (
    <main style={{ gridColumn: '1 / -1' }}>
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Select two users for Date Night matching:</h3>
        <select className="search-input" style={{ margin: 0, padding: '0.5rem', minWidth: '150px' }} value={dateUser1} onChange={e => setDateUser1(e.target.value)}>
          <option value="">User 1...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>+</span>
        <select className="search-input" style={{ margin: 0, padding: '0.5rem', minWidth: '150px' }} value={dateUser2} onChange={e => setDateUser2(e.target.value)}>
          <option value="">User 2...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="movie-grid">
        {dateUser1 && dateUser2 && dateNightMatches.map(movie => (
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

      {dateUser1 && dateUser2 && dateNightMatches.length === 0 && !loading && (
        <div className="no-results glass">No perfect matches found. Try liking more movies!</div>
      )}
      
      {(!dateUser1 || !dateUser2) && (
        <div className="no-results glass">Select two profiles above to see mutual recommendations.</div>
      )}
    </main>
  );
}
