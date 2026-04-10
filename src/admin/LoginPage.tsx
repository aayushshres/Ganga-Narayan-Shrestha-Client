import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inputStyle } from '../styles/admin';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/admin');
    } catch {
      setError('प्रयोगकर्ता नाम वा पासवर्ड गलत छ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '2.5rem',
        borderRadius: '8px',
        boxShadow: 'var(--shadow)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border-color)',
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
        }}>
          प्रशासन लगइन
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              प्रयोगकर्ता नाम
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="प्रयोगकर्ता नाम"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              पासवर्ड
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="पासवर्ड"
              style={inputStyle}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
            />
          </div>
          {error && <p style={{ color: '#D32F2F', margin: 0 }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: '0.75rem',
              background: 'var(--crimson)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
            }}
          >
            {loading ? 'लगइन हुँदैछ...' : 'लगइन गर्नुहोस्'}
          </button>
        </div>
      </div>
    </div>
  );
}
