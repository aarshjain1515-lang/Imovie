import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useCity } from '../../hooks/useCity';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { city, cities, changeCity } = useCity();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = user?.name || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const firstName = displayName.split(' ')[0];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="site-logo" onClick={closeMenu}>
            i<span className="logo-dot">●</span>Movies
          </Link>

          <div className="city-picker-wrapper desktop-only">
            <select
              id="headerCitySelect"
              value={city}
              onChange={(e) => changeCity(e.target.value)}
              className="city-select"
              aria-label="Select your city"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <nav className="header-nav desktop-only">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              Now showing
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              All movies
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/my-tickets"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  My tickets
                </NavLink>
                <NavLink
                  to="/watchlist"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  Watchlist
                </NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          {user ? (
            <div className="user-profile-menu desktop-only">
              <Link to="/profile" className="profile-btn" title="View Profile">
                <span className="profile-avatar">{initial}</span>
                <span className="profile-name">{firstName}</span>
              </Link>
              <button type="button" onClick={logout} className="logout-btn">
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="login-header-btn desktop-only"
            >
              Log in
            </button>
          )}

          {/* Mobile menu toggle hamburger */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-header">
            <div className="city-picker-wrapper mobile-city-picker">
              <label htmlFor="mobileCitySelect" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>City: </label>
              <select
                id="mobileCitySelect"
                value={city}
                onChange={(e) => changeCity(e.target.value)}
                className="city-select"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <nav className="mobile-nav-links">
            <NavLink to="/" end className="mobile-nav-item" onClick={closeMenu}>
              🎬 Now showing
            </NavLink>
            <NavLink to="/movies" className="mobile-nav-item" onClick={closeMenu}>
              🍿 All movies
            </NavLink>
            {user && (
              <>
                <NavLink to="/my-tickets" className="mobile-nav-item" onClick={closeMenu}>
                  🎟️ My tickets
                </NavLink>
                <NavLink to="/watchlist" className="mobile-nav-item" onClick={closeMenu}>
                  ❤️ Watchlist
                </NavLink>
                <NavLink to="/profile" className="mobile-nav-item" onClick={closeMenu}>
                  👤 Profile ({displayName})
                </NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className="mobile-nav-item admin-link" onClick={closeMenu}>
                👑 Admin Dashboard
              </NavLink>
            )}
          </nav>

          <div className="mobile-drawer-footer">
            {user ? (
              <button
                type="button"
                className="mobile-auth-btn logout"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                className="mobile-auth-btn login"
                onClick={() => {
                  navigate('/login');
                  closeMenu();
                }}
              >
                Log in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
