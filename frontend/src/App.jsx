import React, { useState, useEffect } from 'react';
import HouseholdConfig from './components/HouseholdConfig';
import MovieModal from './components/MovieModal';

import DiscoverTab from './components/tabs/DiscoverTab';
import ForYouTab from './components/tabs/ForYouTab';
import WatchlistTab from './components/tabs/WatchlistTab';
import DateNightTab from './components/tabs/DateNightTab';

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  
  // User Management
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  // Global Movie State
  const [preferences, setPreferences] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // --- Discover Tab State ---
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [minScore, setMinScore] = useState(0);

  // --- For You Tab State ---
  const [recommendations, setRecommendations] = useState([]);

  // --- Watchlist Tab State ---
  const [watchlistMovies, setWatchlistMovies] = useState([]);

  // --- Date Night Tab State ---
  const [dateNightMatches, setDateNightMatches] = useState([]);
  const [dateUser1, setDateUser1] = useState('');
  const [dateUser2, setDateUser2] = useState('');

  // Global Loading State
  const [loading, setLoading] = useState(false);

  // Metadata Filter Options
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Fetch initial metadata & users
  useEffect(() => {
    fetch(`${API_BASE}/movies/genres`).then(res => res.json()).then(setGenres);
    fetch(`${API_BASE}/movies/providers`).then(res => res.json()).then(setProviders);
    fetch(`${API_BASE}/movies/certifications`).then(res => res.json()).then(setCertifications);
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (data.length > 0 && !activeUser) setActiveUser(data[0]);
        else if (data.length === 0) setActiveUser(null);
        else {
          const updatedActive = data.find(u => u.id === activeUser?.id);
          if (updatedActive) setActiveUser(updatedActive);
        }
      })
      .catch(console.error);
  };

  // Reset Discover page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore]);

  // Handle Active User change
  useEffect(() => {
    if (!activeUser) {
      setPreferences([]);
      setRecommendations([]);
      setWatchlist([]);
      setWatchlistMovies([]);
      return;
    }

    if (activeUser.type === 'adult') setSelectedRatings(["G", "PG", "PG-13", "R", "NC-17"]);
    else {
      const age = activeUser.age || 0;
      if (age < 10) setSelectedRatings(["G"]);
      else if (age >= 10 && age < 13) setSelectedRatings(["G", "PG"]);
      else setSelectedRatings(["G", "PG", "PG-13"]);
    }

    fetchPreferences();
    fetchWatchlist();
  }, [activeUser]);

  // Tab Data Fetching Logic
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (activeTab === 'discover') fetchMovies(page, signal);
    else if (activeTab === 'recommendations' && activeUser) fetchRecommendations(signal);
    else if (activeTab === 'watchlist' && activeUser) fetchWatchlistFull();
    else if (activeTab === 'date-night' && dateUser1 && dateUser2) fetchDateNight(signal);

    return () => controller.abort();
  }, [activeTab, searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore, activeUser, page, dateUser1, dateUser2]);

  const fetchPreferences = () => {
    if (!activeUser) return;
    fetch(`${API_BASE}/preferences?userId=${activeUser.id}`)
      .then(res => res.json())
      .then(setPreferences)
      .catch(console.error);
  };

  const fetchWatchlist = async () => {
    if (!activeUser) return;
    try {
      const res = await fetch(`${API_BASE}/watchlist?userId=${activeUser.id}`);
      setWatchlist(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchWatchlistFull = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/watchlist?userId=${activeUser.id}`);
      const data = await res.json();
      setWatchlist(data);
      if (data.length > 0) {
        const promises = data.map(w => fetch(`${API_BASE}/movies/${w.movieId}`).then(r => r.json()));
        setWatchlistMovies(await Promise.all(promises));
      } else setWatchlistMovies([]);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchMovies = (currentPage, signal) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage);
    if (searchQuery) params.append('searchQuery', searchQuery);
    if (selectedProviders.length) params.append('providers', selectedProviders.join('|'));
    if (selectedGenres.length) params.append('genres', selectedGenres.join('|'));
    if (selectedRatings.length) params.append('ratings', selectedRatings.join('|'));
    if (minScore > 0) params.append('minScore', minScore);

    fetch(`${API_BASE}/movies?${params.toString()}`, { signal })
      .then(res => res.json())
      .then(data => {
        if (currentPage === 1) setMovies(data);
        else setMovies(prev => {
          const newMovies = data.filter(movie => !prev.some(p => p.id === movie.id));
          return [...prev, ...newMovies];
        });
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setLoading(false));
  };

  const fetchRecommendations = (signal) => {
    fetch(`${API_BASE}/recommendations?userId=${activeUser.id}`, { signal })
      .then(res => res.json())
      .then(setRecommendations)
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
  };

  const fetchDateNight = (signal) => {
    fetch(`${API_BASE}/date-night?user1=${dateUser1}&user2=${dateUser2}`, { signal })
      .then(res => res.json())
      .then(setDateNightMatches)
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
  };

  const handlePreferenceChange = async (movieId, preference) => {
    if (!activeUser) return alert("Please select a profile first.");
    try {
      await fetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, movieId, preference })
      });
      fetchPreferences();
    } catch (err) { console.error(err); }
  };

  const handleWatchlistChange = async (movieId, addToWatchlist) => {
    if (!activeUser) return alert("Please select a profile first.");
    try {
      if (addToWatchlist) {
        await fetch(`${API_BASE}/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeUser.id, movieId })
        });
      } else {
        await fetch(`${API_BASE}/watchlist/${activeUser.id}/${movieId}`, { method: 'DELETE' });
      }
      fetchWatchlist();
      if (activeTab === 'watchlist') fetchWatchlistFull();
    } catch (err) { console.error(err); }
  };

  const toggleFilter = (setter, state, value) => {
    setter(state.includes(value) ? state.filter(v => v !== value) : [...state, value]);
  };

  return (
    <div className="app-container">
      {selectedMovieId && (
        <MovieModal movieId={selectedMovieId} API_BASE={API_BASE} onClose={() => setSelectedMovieId(null)} />
      )}

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
              {users.map(u => <option key={u.id} value={u.id}>{u.name} {u.type === 'child' ? `(Age ${u.age})` : ''}</option>)}
            </select>
          </div>
        )}
      </header>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>Discover</button>
        <button className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>For You</button>
        <button className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}>Watchlist</button>
        <button className={`tab-btn ${activeTab === 'date-night' ? 'active' : ''}`} onClick={() => setActiveTab('date-night')}>Date Night</button>
        <button className={`tab-btn ${activeTab === 'household' ? 'active' : ''}`} onClick={() => setActiveTab('household')}>Household</button>
      </div>

      <div className="layout">
        {activeTab === 'household' && (
          <main style={{ gridColumn: '1 / -1' }}>
            <HouseholdConfig users={users} fetchUsers={fetchUsers} API_BASE={API_BASE} activeUser={activeUser} setActiveUser={setActiveUser} />
          </main>
        )}

        {activeTab !== 'household' && !activeUser && (
           <main style={{ gridColumn: '1 / -1' }}>
             <div className="no-results glass">Please configure a household profile first in the Household tab!</div>
           </main>
        )}

        {activeTab === 'discover' && activeUser && (
          <DiscoverTab 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            providers={providers} selectedProviders={selectedProviders} toggleFilter={toggleFilter} setSelectedProviders={setSelectedProviders}
            genres={genres} selectedGenres={selectedGenres} setSelectedGenres={setSelectedGenres}
            certifications={certifications} selectedRatings={selectedRatings} setSelectedRatings={setSelectedRatings}
            minScore={minScore} setMinScore={setMinScore}
            movies={movies} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId}
            loading={loading} setPage={setPage}
          />
        )}

        {activeTab === 'recommendations' && activeUser && (
          <ForYouTab 
            recommendations={recommendations} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId} loading={loading} activeUser={activeUser}
          />
        )}

        {activeTab === 'watchlist' && activeUser && (
          <WatchlistTab 
            watchlistMovies={watchlistMovies} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId} loading={loading}
          />
        )}

        {activeTab === 'date-night' && activeUser && (
          <DateNightTab 
            dateNightMatches={dateNightMatches} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId} loading={loading}
            users={users} dateUser1={dateUser1} setDateUser1={setDateUser1} dateUser2={dateUser2} setDateUser2={setDateUser2}
          />
        )}
      </div>
    </div>
  );
}

export default App;
