import React, { useState, useEffect } from 'react';
import MovieCard from './components/MovieCard';
import HouseholdConfig from './components/HouseholdConfig';

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  
  // User Management
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  // Data state
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState([]);
  
  // Filter options
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [minScore, setMinScore] = useState(0);

  // Fetch initial metadata & users
  useEffect(() => {
    fetch(`${API_BASE}/genres`).then(res => res.json()).then(setGenres);
    fetch(`${API_BASE}/providers`).then(res => res.json()).then(setProviders);
    fetch(`${API_BASE}/certifications`).then(res => res.json()).then(setCertifications);
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (data.length > 0 && !activeUser) {
          setActiveUser(data[0]);
        } else if (data.length === 0) {
          setActiveUser(null);
        } else {
          // Keep active user updated if edited
          const updatedActive = data.find(u => u.id === activeUser?.id);
          if (updatedActive) setActiveUser(updatedActive);
        }
      })
      .catch(console.error);
  };

  // Handle active user change: fetch their preferences and set default ratings
  useEffect(() => {
    if (!activeUser) {
      setPreferences([]);
      setRecommendations([]);
      return;
    }

    // Set Default Ratings based on Age/Type
    if (activeUser.type === 'adult') {
      setSelectedRatings(["G", "PG", "PG-13", "R", "NC-17"]); // All
    } else if (activeUser.type === 'child') {
      const age = activeUser.age || 0;
      if (age < 10) setSelectedRatings(["G"]);
      else if (age >= 10 && age < 13) setSelectedRatings(["G", "PG"]);
      else setSelectedRatings(["G", "PG", "PG-13"]);
    }

    fetchPreferences();
  }, [activeUser]);

  // Fetch movies when filters change, with AbortController to prevent race conditions
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (activeTab === 'discover') {
      fetchMovies(signal);
    } else if (activeTab === 'recommendations' && activeUser) {
      fetchRecommendations(signal);
    }

    return () => {
      controller.abort();
    };
  }, [activeTab, searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore, activeUser]);

  const fetchPreferences = () => {
    if (!activeUser) return;
    fetch(`${API_BASE}/preferences?userId=${activeUser.id}`)
      .then(res => res.json())
      .then(setPreferences)
      .catch(console.error);
  };

  const fetchMovies = (signal) => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('searchQuery', searchQuery);
    if (selectedProviders.length) params.append('providers', selectedProviders.join('|'));
    if (selectedGenres.length) params.append('genres', selectedGenres.join('|'));
    if (selectedRatings.length) params.append('ratings', selectedRatings.join('|'));
    if (minScore > 0) params.append('minScore', minScore);

    fetch(`${API_BASE}/movies?${params.toString()}`, { signal })
      .then(res => res.json())
      .then(setMovies)
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
  };

  const fetchRecommendations = (signal) => {
    if (!activeUser) return;
    fetch(`${API_BASE}/recommendations?userId=${activeUser.id}`, { signal })
      .then(res => res.json())
      .then(setRecommendations)
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
  };

  const handlePreferenceChange = async (movieId, preference) => {
    if (!activeUser) {
      alert("Please select a profile first.");
      return;
    }
    try {
      await fetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, movieId, preference })
      });
      fetchPreferences();
      if (activeTab === 'recommendations') {
        fetchRecommendations(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFilter = (setter, state, value) => {
    setter(state.includes(value) ? state.filter(v => v !== value) : [...state, value]);
  };

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>MovieNight</h1>
          <p>Find your next favorite movie across all your streaming services.</p>
        </div>
        
        {users.length > 0 && (
          <div className="profile-selector" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Watching as:</span>
            <select 
              className="search-input" 
              style={{ margin: 0, padding: '0.5rem', appearance: 'auto', minWidth: '150px' }}
              value={activeUser?.id || ''}
              onChange={e => {
                const u = users.find(u => u.id === parseInt(e.target.value));
                if (u) setActiveUser(u);
              }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} {u.type === 'child' ? `(Age ${u.age})` : ''}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          For You
        </button>
        <button 
          className={`tab-btn ${activeTab === 'household' ? 'active' : ''}`}
          onClick={() => setActiveTab('household')}
        >
          Household
        </button>
      </div>

      <div className="layout">
        {activeTab === 'household' && (
          <main style={{ gridColumn: '1 / -1' }}>
            <HouseholdConfig 
              users={users} 
              fetchUsers={fetchUsers} 
              API_BASE={API_BASE} 
              activeUser={activeUser}
              setActiveUser={setActiveUser}
            />
          </main>
        )}

        {activeTab === 'discover' && (
          <aside className="filters-sidebar glass">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search movies..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div className="filter-group">
              <h3>Streaming Services</h3>
              {providers.map(p => (
                <label key={p.provider_id} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedProviders.includes(p.provider_id)}
                    onChange={() => toggleFilter(setSelectedProviders, selectedProviders, p.provider_id)}
                  />
                  {p.provider_name}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Genres</h3>
              {genres.map(g => (
                <label key={g.id} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedGenres.includes(g.id)}
                    onChange={() => toggleFilter(setSelectedGenres, selectedGenres, g.id)}
                  />
                  {g.name}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3>Rating (Certification)</h3>
              </div>
              {certifications.map(c => (
                <label key={c} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedRatings.includes(c)}
                    onChange={() => toggleFilter(setSelectedRatings, selectedRatings, c)}
                  />
                  {c}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Min Review Score: {minScore > 0 ? minScore : 'Any'}</h3>
              <input 
                type="range" 
                min="0" max="10" step="0.5" 
                value={minScore} 
                onChange={e => setMinScore(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </aside>
        )}

        {activeTab !== 'household' && (
          <main style={{ gridColumn: activeTab === 'discover' ? 'auto' : '1 / -1' }}>
            {!activeUser && (
               <div className="no-results glass" style={{ gridColumn: '1 / -1' }}>
                 Please configure a household profile first in the Household tab!
               </div>
            )}
            
            {activeUser && (
              <div className="movie-grid">
                {activeTab === 'discover' ? (
                  movies.length > 0 ? (
                    movies.map(movie => (
                      <MovieCard 
                        key={movie.id} 
                        movie={movie} 
                        preferences={preferences} 
                        onPreferenceChange={handlePreferenceChange} 
                      />
                    ))
                  ) : (
                    <div className="no-results glass">No movies match your filters.</div>
                  )
                ) : (
                  recommendations.length > 0 ? (
                    recommendations.map(movie => (
                      <MovieCard 
                        key={movie.id} 
                        movie={movie} 
                        preferences={preferences} 
                        onPreferenceChange={handlePreferenceChange} 
                      />
                    ))
                  ) : (
                    <div className="no-results glass">
                      Not enough data to make recommendations for {activeUser.name}. Like some movies in the Discover tab first!
                    </div>
                  )
                )}
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
