import React from 'react';
import { ThumbsUp, ThumbsDown, Star, Bookmark } from 'lucide-react';

export default function MovieCard({ movie, preferences, watchlist = [], onPreferenceChange, onWatchlistChange, onSelectMovie }) {
  const currentPref = preferences.find(p => p.movieId === movie.id)?.preference;
  const inWatchlist = watchlist.find(w => w.movieId === movie.id);

  // Simple gradient generator based on movie id to make placeholders look distinct and premium
  const hue = (movie.id * 137.5) % 360;
  const gradientStyle = {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${(hue + 40) % 360}, 60%, 10%))`
  };

  return (
    <div className="movie-card glass">
      <div style={{ cursor: 'pointer', position: 'relative' }} onClick={() => onSelectMovie && onSelectMovie(movie.id)}>
        {movie.poster_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title} 
            className="movie-poster" 
            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
          />
        ) : (
          <div className="movie-poster-placeholder" style={gradientStyle}>
            {movie.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="movie-info">
        <h3 className="movie-title" style={{ cursor: 'pointer' }} onClick={() => onSelectMovie && onSelectMovie(movie.id)}>{movie.title}</h3>
        <div className="movie-meta">
          <span className="badge">{movie.original_language?.toUpperCase() || 'EN'}</span>
          <span className="rating">
            <Star size={14} fill="currentColor" /> {movie.vote_average?.toFixed(1)}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', flexGrow: 1 }}>
          {movie.release_date?.substring(0, 4)}
        </div>
        
        <div className="movie-actions">
          <button 
            className={`action-btn ${currentPref === 'like' ? 'active-like' : ''}`}
            onClick={() => onPreferenceChange(movie.id, 'like')}
            title="Like"
          >
            <ThumbsUp size={18} />
          </button>
          <button 
            className={`action-btn ${currentPref === 'dislike' ? 'active-dislike' : ''}`}
            onClick={() => onPreferenceChange(movie.id, 'dislike')}
            title="Dislike"
          >
            <ThumbsDown size={18} />
          </button>
          <button 
            className={`action-btn ${inWatchlist ? 'active-watchlist' : ''}`}
            onClick={() => onWatchlistChange(movie.id, !inWatchlist)}
            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            style={{ marginLeft: 'auto', color: inWatchlist ? 'var(--accent)' : '' }}
          >
            <Bookmark size={18} fill={inWatchlist ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
