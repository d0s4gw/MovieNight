import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import MovieModal from './components/MovieModal';

import DiscoverTab from './components/tabs/DiscoverTab';
import ForYouTab from './components/tabs/ForYouTab';
import WatchlistTab from './components/tabs/WatchlistTab';
import DateNightTab from './components/tabs/DateNightTab';
import HouseholdConfig from './components/HouseholdConfig';

import { LogOut, User, Users } from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('discover');
  
  // Profile Management
  const [profile, setProfile] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState('');

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
  const [dateUser1, setDateUser1] = useState('');

  // Household Users State
  const [users, setUsers] = useState([]);

  // Global Loading State
  const [loading, setLoading] = useState(false);

  // Metadata Filter Options
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Fetch initial metadata & profile
  useEffect(() => {
    if (!token) return;

    const initData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch basic metadata
        fetch(`${API_BASE}/movies/genres`, { headers }).then(res => res.json()).then(setGenres);
        fetch(`${API_BASE}/movies/providers`, { headers }).then(res => res.json()).then(setProviders);
        fetch(`${API_BASE}/movies/certifications`, { headers }).then(res => res.json()).then(setCertifications);
        
        // Fetch/Initialize primary user profile
        const profileData = await authenticatedFetch(`${API_BASE}/users/profile`);
        if (profileData) {
          setProfile(profileData);
          if (profileData.id) setActiveProfileId(profileData.id);
        }

        // Fetch all household profiles
        await fetchUsers();
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initData();
  }, [token]);

  // Fetch data specific to the active profile
  useEffect(() => {
    if (!token || !activeProfileId) return;
    fetchPreferences();
    fetchWatchlist();
  }, [token, activeProfileId]);

  // Sync ratings/restrictions when profile changes
  useEffect(() => {
    if (!profile) return;
    
    if (profile.type === 'adult') {
      setSelectedRatings(["G", "PG", "PG-13", "R", "NC-17"]);
    } else {
      const age = profile.age || 0;
      if (age < 10) setSelectedRatings(["G"]);
      else if (age >= 10 && age < 13) setSelectedRatings(["G", "PG"]);
      else setSelectedRatings(["G", "PG", "PG-13"]);
    }
  }, [profile]);

  // Reset Discover page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore]);

  // Tab Data Fetching Logic
  useEffect(() => {
    if (!token || !activeProfileId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    if (activeTab === 'discover') fetchMovies(page, signal);
    else if (activeTab === 'recommendations') fetchRecommendations(signal);
    else if (activeTab === 'watchlist') fetchWatchlistFull();
    else if (activeTab === 'date-night' && dateUser2) fetchDateNight(signal);

    return () => controller.abort();
  }, [activeTab, searchQuery, selectedProviders, selectedGenres, selectedRatings, minScore, activeProfileId, page, dateUser2, token]);

  const authenticatedFetch = async (url, options = {}) => {
    if (!token) return null;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'x-profile-id': activeProfileId,
      ...options.headers 
    };
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`Backend returned ${res.status}:`, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`Fetch error for ${url}:`, err);
      }
      throw err;
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await authenticatedFetch(`${API_BASE}/preferences`);
      if (data) setPreferences(data);
    } catch (e) {}
  };

  const fetchWatchlist = async () => {
    try {
      const data = await authenticatedFetch(`${API_BASE}/watchlist`);
      if (data) setWatchlist(data);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const data = await authenticatedFetch(`${API_BASE}/users`);
      if (!data) return;
      setUsers(data);
      if (data.length > 0 && !dateUser1) setDateUser1(data[0].id);
      if (data.length > 0 && !activeProfileId) {
        setActiveProfileId(data[0].id);
        setProfile(data[0]);
      }
    } catch (e) {}
  };

  const fetchWatchlistFull = async () => {
    if (!activeProfileId) return;
    setLoading(true);
    try {
      const data = await authenticatedFetch(`${API_BASE}/watchlist`);
      if (data) {
        setWatchlist(data);
        if (data.length > 0) {
          const promises = data.map(w => authenticatedFetch(`${API_BASE}/movies/${w.movieId}`));
          setWatchlistMovies(await Promise.all(promises));
        } else setWatchlistMovies([]);
      }
    } catch (e) {}
    setLoading(false);
  };

  const fetchMovies = async (currentPage, signal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: currentPage });
    if (searchQuery) params.append('searchQuery', searchQuery);
    if (selectedProviders.length) params.append('providers', selectedProviders.join('|'));
    if (selectedGenres.length) params.append('genres', selectedGenres.join('|'));
    if (selectedRatings.length) params.append('ratings', selectedRatings.join('|'));
    if (minScore > 0) params.append('minScore', minScore);

    try {
      const data = await authenticatedFetch(`${API_BASE}/movies?${params.toString()}`, { signal });
      if (data) {
        if (currentPage === 1) setMovies(data);
        else setMovies(prev => {
          const newMovies = data.filter(movie => !prev.some(p => p.id === movie.id));
          return [...prev, ...newMovies];
        });
      }
    } catch (err) {}
    finally { setLoading(false); }
  };

  const fetchRecommendations = async (signal) => {
    setLoading(true);
    try {
      const data = await authenticatedFetch(`${API_BASE}/recommendations`, { signal });
      if (data) setRecommendations(data);
    } catch(err) {}
    finally { setLoading(false); }
  };

  const fetchDateNight = async (signal) => {
    if (!dateUser1 || !dateUser2) return;
    setLoading(true);
    try {
      const data = await authenticatedFetch(`${API_BASE}/date-night?user1=${dateUser1}&user2=${dateUser2}`, { signal });
      if (data) setDateNightMatches(data);
    } catch(err) {}
    finally { setLoading(false); }
  };

  const handlePreferenceChange = async (movieId, preference) => {
    try {
      await authenticatedFetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, preference })
      });
      fetchPreferences();
    } catch (err) {}
  };

  const handleWatchlistChange = async (movieId, addToWatchlist) => {
    try {
      if (addToWatchlist) {
        await authenticatedFetch(`${API_BASE}/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId })
        });
      } else {
        await authenticatedFetch(`${API_BASE}/watchlist/${movieId}`, { method: 'DELETE' });
      }
      fetchWatchlist();
      if (activeTab === 'watchlist') fetchWatchlistFull();
    } catch (err) {}
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
          {users.length > 0 && (
            <select 
              className="search-input" 
              style={{ margin: 0, padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem' }}
              value={activeProfileId}
              onChange={(e) => {
                const newId = e.target.value;
                setActiveProfileId(newId);
                const found = users.find(u => u.id === newId);
                if (found) setProfile(found);
              }}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}

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
        <button className={`tab-btn ${activeTab === 'household' ? 'active' : ''}`} onClick={() => setActiveTab('household')}>Household</button>
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
            users={users} dateUser1={dateUser1} setDateUser1={setDateUser1} dateUser2={dateUser2} setDateUser2={setDateUser2}
          />
        )}

        {activeTab === 'household' && (
          <HouseholdConfig 
            users={users} 
            fetchUsers={fetchUsers} 
            API_BASE={API_BASE}
            activeUser={profile}
            token={token}
          />
        )}
      </div>
    </div>
  );
}

export default App;
