import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function MovieModal({ movieId, API_BASE, onClose }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/movies/${movieId}`)
      .then(res => res.json())
      .then(setDetails)
      .catch(console.error);
  }, [movieId, API_BASE]);

  if (!details) {
    return (
      <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>Loading...</div>
      </div>
    );
  }

  const trailer = details.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const cast = details.credits?.cast?.slice(0, 5) || [];
  const watchLink = details['watch/providers']?.results?.US?.link;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          <X size={20} />
        </button>

        {trailer ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </div>
        ) : (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            No trailer available
          </div>
        )}

        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>{details.title}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>{details.overview}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Top Cast</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-secondary)' }}>
                {cast.map(actor => (
                  <li key={actor.id} style={{ marginBottom: '0.25rem' }}>{actor.name} <span style={{ opacity: 0.5, fontSize: '0.85em' }}>as {actor.character}</span></li>
                ))}
              </ul>
            </div>
            <div>
               <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Details</h3>
               <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>Runtime: {details.runtime} mins</p>
               <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>Status: {details.status}</p>
            </div>
          </div>

          {watchLink && (
            <a 
              href={watchLink} 
              target="_blank" 
              rel="noreferrer"
              className="tab-btn active" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem' }}
            >
              Watch Now on TMDB <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
