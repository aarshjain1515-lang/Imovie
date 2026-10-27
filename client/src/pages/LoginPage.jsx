import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract redirect url parameter
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email or username.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email.trim(), password);
      // If user is admin and no explicit redirect was provided, take them to admin or redirect
      if (loggedUser?.role === 'admin' && redirect === '/') {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Invalid login details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            i<span className="logo-dot">●</span>Movies
          </div>
          <h1 className="auth-title">Log in to your account</h1>
          <p className="auth-subtitle">Fast cinema booking, live seat selection, digital passes.</p>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="loginEmail">Email address or username</label>
            <input
              id="loginEmail"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rohit, user@gmail.com, or admin@imovies.com"
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" block disabled={loading} style={{ marginTop: 12 }}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`} className="auth-link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
