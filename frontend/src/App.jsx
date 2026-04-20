import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import MovieModal from './components/MovieModal';

import DiscoverTab from './components/tabs/DiscoverTab';
import ForYouTab from './components/tabs/ForYouTab';
import WatchlistTab from './components/tabs/WatchlistTab';
import DateNightTab from './components/tabs/DateNightTab';

import { LogOut, User } from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('discover');
  
  // Profile Management (Single User)
  const [profile, setProfile] = useState(null);

  // --- Auth Effect ---
  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });
  }, []);

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
  const [dateUser2, setDateUser2] = useState('');

  // Global Loading State
  const [loading, setLoading] = useState(false);

  // Metadata Filter Options
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Fetch initial metadata & profile
  useEffect(() => {
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch basic metadata
    fetch(`${API_BASE}/movies/genres`, { headers }).then(res => res.json()).then(setGenres);
    fetch(`${API_BASE}/movies/providers`, { headers }).then(res => res.json()).then(setProviders);
    fetch(`${API_BASE}/movies/certifications`, { headers }).then(res => res.json()).then(setCertifications);
    
    // Fetch user profile
    fetch(`${API_BASE}/user/profile`, { headers })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        // Set initial ratings based on profile type
        if (data.type === 'adult') setSelectedRatings(["G", "PG", "PG-13", "R", "NC-17"]);
        else {
          const age = data.age || 0;
          if (age < 10) setSelectedRatings(["G"]);
          else if (age >= 10 && age < 13) setSelectedRatings(["G", "PG"]);
          else setSelectedRatings(["G", "PG", "PG-13"]);
        }
      });

    fetchPreferences();
    fetchWatchlist();
  }, [token]);

  // Reset Discover page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore]);

  // Tab Data Fetching Logic
  useEffect(() => {
    if (!token || !profile) return;

    const controller = new AbortController();
    const signal = controller.signal;

    if (activeTab === 'discover') fetchMovies(page, signal);
    else if (activeTab === 'recommendations') fetchRecommendations(signal);
    else if (activeTab === 'watchlist') fetchWatchlistFull();
    else if (activeTab === 'date-night' && dateUser2) fetchDateNight(signal);

    return () => controller.abort();
  }, [activeTab, searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore, profile, page, dateUser2, token]);

  const fetchPreferences = () => {
    fetch(`${API_BASE}/preferences`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setPreferences)
      .catch(console.error);
  };

  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API_BASE}/watchlist`, { headers: { 'Authorization': `Bearer ${token}` } });
      setWatchlist(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchWatchlistFull = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`${API_BASE}/watchlist`, { headers });
      const data = await res.json();
      setWatchlist(data);
      if (data.length > 0) {
        const promises = data.map(w => fetch(`${API_BASE}/movies/${w.movieId}`, { headers }).then(r => r.json()));
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

    fetch(`${API_BASE}/movies?${params.toString()}`, { signal, headers: { 'Authorization': `Bearer ${token}` } })
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
    fetch(`${API_BASE}/recommendations`, { signal, headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setRecommendations)
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
  };

  const fetchDateNight = (signal) => {
    fetch(`${API_BASE}/date-night?user2=${dateUser2}`, { signal, headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setDateNightMatches)
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
  };

  const handlePreferenceChange = async (movieId, preference) => {
    try {
      await fetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ movieId, preference })
      });
      fetchPreferences();
    } catch (err) { console.error(err); }
  };

  const handleWatchlistChange = async (movieId, addToWatchlist) => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      if (addToWatchlist) {
        await fetch(`${API_BASE}/watchlist`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId })
        });
      } else {
        await fetch(`${API_BASE}/watchlist/${movieId}`, { method: 'DELETE', headers });
      }
      fetchWatchlist();
      if (activeTab === 'watchlist') fetchWatchlistFull();
    } catch (err) { console.error(err); }
  };

  const toggleFilter = (setter, state, value) => {
    setter(state.includes(value) ? state.filter(v => v !== value) : [...state, value]);
  };

  if (authLoading) return <div className="no-results">Loading...</div>;

  if (!user) return <Auth />;

  return (
    <div className="app-container">
      {selectedMovieId && (
        <MovieModal movieId={selectedMovieId} API_BASE={API_BASE} onClose={() => setSelectedMovieId(null)} />
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1>MovieNight</h1>
          <p>Find your next favorite movie across all your streaming services.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', borderRadius: '999px' }}>
            <User size={18} color="var(--accent)" />
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.displayName || user.email}</span>
          </div>
          <button onClick={() => signOut(auth)} className="tab-btn" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>Discover</button>
        <button className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>For You</button>
        <button className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}>Watchlist</button>
        <button className={`tab-btn ${activeTab === 'date-night' ? 'active' : ''}`} onClick={() => setActiveTab('date-night')}>Date Night</button>
      </div>

      <div className="layout">
        {activeTab === 'discover' && profile && (
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

        {activeTab === 'recommendations' && profile && (
          <ForYouTab 
            recommendations={recommendations} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId} loading={loading} activeUser={profile}
          />
        )}

        {activeTab === 'watchlist' && profile && (
          <WatchlistTab 
            watchlistMovies={watchlistMovies} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId} loading={loading}
          />
        )}

        {activeTab === 'date-night' && profile && (
          <DateNightTab 
            dateNightMatches={dateNightMatches} preferences={preferences} watchlist={watchlist}
            handlePreferenceChange={handlePreferenceChange} handleWatchlistChange={handleWatchlistChange}
            setSelectedMovieId={setSelectedMovieId} loading={loading}
            users={[]} dateUser1={user.uid} setDateUser1={()=>{}} dateUser2={dateUser2} setDateUser2={setDateUser2}
          />
        )}
      </div>
    </div>
  );
}

export default App;
