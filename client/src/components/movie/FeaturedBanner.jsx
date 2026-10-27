import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import './FeaturedBanner.css';

export default function FeaturedBanner({ movie, loading }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (loading) {
    return (
      <div className="featured-banner featured-banner--loading">
        <div className="featured-banner__inner">
          <div className="featured-banner__content">
            <Skeleton variant="text" width="90px" style={{ marginBottom: 16 }} />
            <Skeleton variant="title" width="360px" height="48px" style={{ marginBottom: 16 }} />
            <Skeleton variant="text" width="220px" style={{ marginBottom: 16 }} />
            <Skeleton variant="text" width="460px" style={{ marginBottom: 8 }} />
            <Skeleton variant="text" width="380px" style={{ marginBottom: 28 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <Skeleton variant="rect" width="160px" height="44px" />
              <Skeleton variant="rect" width="160px" height="44px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const backdropUrl = movie.backdrop || movie.poster;

  return (
    <section className="featured-banner">
      {/* Background cinematic backdrop */}
      {backdropUrl && (
        <div
          className="featured-banner__backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      <div className="featured-banner__gradient-mask" />

      <div className="featured-banner__inner">
        <div className="featured-banner__content">
          <div className="featured-banner__tags">
            <span className="featured-badge">Spotlight Premiere</span>
            {movie.language && <span className="format-badge">{movie.language}</span>}
            <span className="format-badge">IMAX 4K</span>
          </div>

          <h1 className="featured-banner__title">{movie.title}</h1>

          <div className="featured-banner__meta">
            {movie.rating && (
              <span className="featured-rating">
                <span className="gold-star">★</span> {movie.rating} Rating
              </span>
            )}
            {movie.duration && (
              <span className="meta-dot">{movie.duration} mins</span>
            )}
            {Array.isArray(movie.genre) && (
              <span className="meta-dot">{movie.genre.join(', ')}</span>
            )}
          </div>

          {movie.synopsis && (
            <p className="featured-banner__synopsis">{movie.synopsis}</p>
          )}

          <div className="featured-banner__actions">
            <Button
              className="featured-primary-cta"
              onClick={() => navigate(`/movies/${movie.slug || movie._id}`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
                <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path>
                <line x1="9" y1="4" x2="9" y2="20"></line>
              </svg>
              Book Tickets Now
            </Button>
            <button
              type="button"
              className="featured-secondary-cta"
              onClick={() => navigate('/movies')}
            >
              Explore Catalog
            </button>
          </div>
        </div>

        <div className="featured-banner__poster">
          {!imgError && movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="featured-poster-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="featured-poster-fallback"
              style={{ backgroundColor: movie.posterColor || '#1f2937' }}
            >
              <span>{movie.title}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
