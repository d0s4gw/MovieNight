import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message || 'Google Sign-In failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.8rem', background: 'linear-gradient(to right, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      
      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email</label>
          <input
            type="email"
            className="search-input"
            style={{ marginBottom: 0 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
          <input
            type="password"
            className="search-input"
            style={{ marginBottom: 0 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        <button type="submit" className="tab-btn active" style={{ marginTop: '1rem', width: '100%', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }} disabled={loading}>
          {isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Sign Up</>}
        </button>
      </form>

      <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }}></div>
        <span style={{ padding: '0 1rem', fontSize: '0.8rem' }}>OR</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }}></div>
      </div>

      <button 
        onClick={handleGoogleSignIn} 
        className="tab-btn" 
        style={{ width: '100%', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
        disabled={loading}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>

      <button 
        onClick={() => setIsLogin(!isLogin)} 
        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', marginTop: '1.5rem' }}
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </div>
  );
};

export default Auth;
