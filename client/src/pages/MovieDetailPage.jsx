import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import movieService from '../services/movieService';
import showService from '../services/showService';
import favoriteService from '../services/favoriteService';
import reviewService from '../services/reviewService';
import { useCity } from '../hooks/useCity';
import { useAuth } from '../hooks/useAuth';
import DatePicker from '../components/booking/DatePicker';
import ShowtimeList from '../components/booking/ShowtimeList';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import './MovieDetailPage.css';

export default function MovieDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { city } = useCity();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [theatresWithShows, setTheatresWithShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  // Load reviews when movie loads
  useEffect(() => {
    if (!movie?._id) return;
    reviewService
      .getByMovie(movie._id)
      .then((res) => {
        setReviews(res.data?.data || []);
      })
      .catch((err) => console.error('Failed to load reviews:', err));
  }, [movie]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    try {
      setSubmittingReview(true);
      setReviewMsg(null);
      const res = await reviewService.create({
        movieId: movie._id,
        rating: Number(newRating),
        comment: newComment.trim(),
      });
      setReviews((prev) => [res.data?.data, ...prev]);
      setNewComment('');
      setReviewMsg('Your review has been posted successfully!');
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Fetch movie details
  useEffect(() => {
    let isMounted = true;
    setLoadingMovie(true);
    setError(null);

    movieService
      .getBySlug(slug)
      .then((res) => {
        if (isMounted) {
          setMovie(res.data?.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load movie:', err);
        if (isMounted) setError('Movie not found or failed to load.');
      })
      .finally(() => {
        if (isMounted) setLoadingMovie(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Fetch shows when movie, city, or date changes
  useEffect(() => {
    if (!movie?._id) return;
    let isMounted = true;
    setLoadingShows(true);

    showService
      .getAll({
        movieId: movie._id,
        city,
        date: selectedDate,
      })
      .then((res) => {
        if (!isMounted) return;
        const shows = res.data?.data || [];

        // Group shows by theatre
        const theatreMap = {};
        shows.forEach((show) => {
          const tId = show.theatreId?._id || show.theatreId;
          const tName = show.theatreId?.name || 'Cinema';
          const tAddress = show.theatreId?.address || city;

          if (!theatreMap[tId]) {
            theatreMap[tId] = {
              _id: tId,
              name: tName,
              address: tAddress,
              shows: [],
            };
          }

          theatreMap[tId].shows.push({
            _id: show._id,
            time: show.time,
            price: show.pricing?.standard || 250,
            screenName: show.screenName,
            soldOut: show.status === 'cancelled',
          });
        });

        setTheatresWithShows(Object.values(theatreMap));
      })
      .catch((err) => {
        console.error('Failed to fetch shows:', err);
        if (isMounted) setTheatresWithShows([]);
      })
      .finally(() => {
        if (isMounted) setLoadingShows(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie, city, selectedDate]);

  // Check if favorite
  useEffect(() => {
    if (!user || !movie?._id) return;
    favoriteService
      .getFavorites()
      .then((res) => {
        const favs = res.data?.data || [];
        const exists = favs.some((f) => f.movieId?._id === movie._id || f.movieId === movie._id);
        setIsFavorite(exists);
      })
      .catch(() => {});
  }, [user, movie]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(movie._id);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(movie._id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to update favorite status:', err);
    }
  };

  const handleSelectShow = (show) => {
    navigate(`/booking/${show._id}`);
  };

  if (loadingMovie) {
    return (
      <div className="movie-detail-loading">
        <div className="detail-container">
          <Skeleton variant="title" width="300px" style={{ marginBottom: 20 }} />
          <Skeleton variant="card" height="320px" />
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="detail-container" style={{ padding: '64px 24px' }}>
        <ErrorState
          message={error || 'Movie could not be loaded.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      {/* Movie Hero Meta Bar */}
      <section className="detail-hero">
        {(movie.backdrop || movie.poster) && (
          <div
            className="detail-hero-backdrop"
            style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
          />
        )}
        <div className="detail-hero-mask" />

        <div className="detail-container hero-grid">
          <div className="hero-poster" style={{ backgroundColor: movie.posterColor || '#14161f' }}>
            {movie.poster ? (
              <img src={movie.poster} alt={movie.title} className="hero-poster-img" />
            ) : (
              <span className="hero-poster-title">{movie.title}</span>
            )}
          </div>

          <div className="hero-info">
            <div className="hero-badges">
              {movie.genre?.map((g) => (
                <span key={g} className="genre-pill">{g}</span>
              ))}
              <span className="lang-pill">{movie.language}</span>
            </div>

            <h1 className="hero-title">{movie.title}</h1>

            <div className="hero-meta-row">
              <span className="meta-item">
                <span className="star-icon">★</span> {movie.rating || 'N/A'}
              </span>
              <span className="bullet">•</span>
              <span className="meta-item">{movie.duration} min</span>
              <span className="bullet">•</span>
              <span className="meta-item">
                {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'Now Showing'}
              </span>
            </div>

            <p className="hero-synopsis">{movie.synopsis}</p>

            <div className="hero-actions">
              <Button
                variant={isFavorite ? 'secondary' : 'outline'}
                onClick={toggleFavorite}
              >
                {isFavorite ? 'Saved to Watchlist' : '+ Add to Watchlist'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shows & Booking Section */}
      <section className="detail-shows-section">
        <div className="detail-container">
          <div className="shows-header">
            <h2 className="shows-section-title">Select Date & Showtime</h2>
            <p className="shows-section-subtitle">Showing in {city}</p>
          </div>

          <DatePicker selected={selectedDate} onChange={setSelectedDate} />

          <div className="theatres-showtimes-wrapper">
            {loadingShows ? (
              <div style={{ padding: '32px 0' }}>
                <Skeleton variant="card" height="100px" style={{ marginBottom: 16 }} />
                <Skeleton variant="card" height="100px" />
              </div>
            ) : (
              <ShowtimeList
                theatres={theatresWithShows}
                onSelect={handleSelectShow}
              />
            )}
          </div>
        </div>
      </section>

      {/* Audience Reviews & Feedback */}
      <section className="detail-shows-section" style={{ borderTop: '1px solid var(--border-color, #232336)', paddingTop: '40px' }}>
        <div className="detail-container">
          <div className="shows-header" style={{ marginBottom: '24px' }}>
            <h2 className="shows-section-title">Audience Reviews & Ratings</h2>
            <p className="shows-section-subtitle">Real feedback from verified moviegoers</p>
          </div>

          {/* Write a Review Box */}
          <div style={{ background: 'var(--card-bg, #161622)', border: '1px solid var(--border-color, #262638)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>
              {user ? 'Share Your Review' : 'Sign in to write a review'}
            </h3>

            {reviewMsg && (
              <p style={{ color: reviewMsg.includes('success') ? '#10b981' : '#ef4444', marginBottom: '12px', fontSize: '0.9rem' }}>
                {reviewMsg}
              </p>
            )}

            {user ? (
              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Rating:</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    style={{ background: '#232334', border: '1px solid #3b3b4f', borderRadius: '6px', color: '#fbbf24', padding: '6px 12px', fontWeight: 700 }}
                  >
                    <option value="5">★★★★★ (5 - Excellent)</option>
                    <option value="4">★★★★☆ (4 - Good)</option>
                    <option value="3">★★★☆☆ (3 - Average)</option>
                    <option value="2">★★☆☆☆ (2 - Poor)</option>
                    <option value="1">★☆☆☆☆ (1 - Terrible)</option>
                  </select>
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tell us what you liked about the acting, direction, and storyline..."
                  rows={3}
                  required
                  style={{ width: '100%', background: '#232334', border: '1px solid #3b3b4f', borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '0.95rem', resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }}
                />

                <Button type="submit" variant="primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </Button>
              </form>
            ) : (
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Sign in to post review
              </Button>
            )}
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p style={{ color: '#9ca3af', fontStyle: 'italic', padding: '16px 0' }}>
                No reviews yet. Be the first to share your thoughts!
              </p>
            ) : (
              reviews.map((r) => (
                <div
                  key={r._id}
                  style={{ background: 'var(--card-bg, #161622)', border: '1px solid var(--border-color, #262638)', borderRadius: '10px', padding: '16px 20px', marginBottom: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                        {r.userId?.name ? r.userId.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{r.userId?.name || 'Verified User'}</span>
                      {r.userId?.city && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>• {r.userId.city}</span>
                      )}
                    </div>
                    <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                    {r.comment}
                  </p>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
