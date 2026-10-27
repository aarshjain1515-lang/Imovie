import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    navigate(`/movies/${movie.slug || movie._id}`);
  };

  const handleBook = (e) => {
    e.stopPropagation();
    navigate(`/movies/${movie.slug || movie._id}`);
  };

  const genres = Array.isArray(movie.genre) ? movie.genre.slice(0, 2) : [];

  return (
    <article
      className="movie-card"
      onClick={handleClick}
      tabIndex={0}
      role="link"
      aria-label={`View ${movie.title}`}
    >
      <div className="movie-card__poster-wrapper">
        {!imgError && movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="movie-card__image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="movie-card__poster-fallback"
            style={{ backgroundColor: movie.posterColor || '#1e2230' }}
          >
            <div className="fallback-glow" />
            <span className="fallback-title">{movie.title}</span>
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="movie-card__overlay" />

        {/* Floating Badges */}
        <div className="movie-card__top-badges">
          {movie.rating && (
            <div className="badge-rating">
              <span className="star-icon">★</span>
              <span className="rating-val">{movie.rating}</span>
            </div>
          )}
          {movie.language && (
            <div className="badge-lang">
              {movie.language}
            </div>
          )}
        </div>

        {/* Hover Quick Action */}
        <div className="movie-card__quick-action">
          <button
            type="button"
            className="quick-book-btn"
            onClick={handleBook}
          >
            Book Seats
          </button>
        </div>
      </div>

      <div className="movie-card__content">
        <h3 className="movie-card__title" title={movie.title}>
          {movie.title}
        </h3>

        <div className="movie-card__meta-row">
          <div className="movie-card__genres">
            {genres.map((g) => (
              <span key={g} className="genre-tag">
                {g}
              </span>
            ))}
          </div>
          {movie.duration && (
            <span className="duration-tag">{movie.duration}m</span>
          )}
        </div>
      </div>
    </article>
  );
}
