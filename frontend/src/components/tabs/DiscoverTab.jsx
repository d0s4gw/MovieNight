import React from 'react';
import MovieCard from '../MovieCard';

export default function DiscoverTab({
  searchQuery, setSearchQuery,
  providers, selectedProviders, toggleFilter, setSelectedProviders,
  genres, selectedGenres, setSelectedGenres,
  certifications, selectedRatings, setSelectedRatings,
  minScore, setMinScore,
  movies, preferences, watchlist,
  handlePreferenceChange, handleWatchlistChange,
  setSelectedMovieId,
  loading, setPage
}) {
  return (
    <>
      <aside className="filters-sidebar glass">
        <input 
          type="text" className="search-input" placeholder="Search movies..." 
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="filter-group">
          <h3>Streaming Services</h3>
          {providers.map(p => (
            <label key={p.provider_id} className="checkbox-label">
              <input type="checkbox" checked={selectedProviders.includes(p.provider_id)} onChange={() => toggleFilter(setSelectedProviders, selectedProviders, p.provider_id)} />
              {p.provider_name}
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>Genres</h3>
          {genres.map(g => (
            <label key={g.id} className="checkbox-label">
              <input type="checkbox" checked={selectedGenres.includes(g.id)} onChange={() => toggleFilter(setSelectedGenres, selectedGenres, g.id)} />
              {g.name}
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>Rating (Certification)</h3>
          {certifications.map(c => (
            <label key={c} className="checkbox-label">
              <input type="checkbox" checked={selectedRatings.includes(c)} onChange={() => toggleFilter(setSelectedRatings, selectedRatings, c)} />
              {c}
            </label>
          ))}
        </div>
        <div className="filter-group">
          <h3>Min Review Score: {minScore > 0 ? minScore : 'Any'}</h3>
          <input type="range" min="0" max="10" step="0.5" value={minScore} onChange={e => setMinScore(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
      </aside>

      <main style={{ gridColumn: 'auto' }}>
        <div className="movie-grid">
          {movies.map(movie => (
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

        {movies.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              className="tab-btn active" 
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
            >
              {loading ? 'Loading...' : 'Load More Movies'}
            </button>
          </div>
        )}
        
        {movies.length === 0 && !loading && (
          <div className="no-results glass">No movies match your filters.</div>
        )}
      </main>
    </>
  );
}
