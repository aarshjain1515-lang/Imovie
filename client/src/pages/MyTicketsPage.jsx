import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../services/bookingService';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import './MyTicketsPage.css';

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    bookingService
      .getMyBookings()
      .then((res) => {
        setBookings(res.data?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load my tickets:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Confirmed seats will be released.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await bookingService.cancel(bookingId);
      fetchBookings();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="my-tickets-page">
      <div className="tickets-page-container">
        <h1 className="tickets-title">My Tickets</h1>
        <p className="tickets-subtitle">View active cinema passes, cancel or review booking history.</p>

        {loading ? (
          <div className="tickets-loading-list">
            <Skeleton variant="card" height="120px" style={{ marginBottom: 16 }} />
            <Skeleton variant="card" height="120px" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No tickets found"
            message="You haven't booked any movie tickets yet. Browse now-showing titles to reserve seats."
          />
        ) : (
          <div className="tickets-list">
            {bookings.map((b) => (
              <div key={b._id} className="ticket-item-card">
                <div className="ticket-item-main">
                  <div className="ticket-status-badge" data-status={b.status}>
                    {b.status}
                  </div>
                  <h3 className="ticket-item-title">{b.movieId?.title || 'Movie'}</h3>
                  <p className="ticket-item-meta">
                    {b.theatreId?.name || 'Theatre'} • {b.showId?.time || 'Showtime'}
                  </p>
                  <p className="ticket-item-seats">
                    Seats: {Array.isArray(b.seats) ? b.seats.map((s) => `${s.row}${s.number}`).join(', ') : 'Assigned'}
                  </p>
                </div>

                <div className="ticket-item-side">
                  <span className="ticket-item-amount">₹{b.totalAmount}</span>
                  <div className="ticket-item-actions">
                    <Link to={`/ticket/${b._id}`} className="view-ticket-link">
                      View QR Ticket
                    </Link>
                    {b.status === 'confirmed' && (
                      <>
                        <Link
                          to={b.movieId?.slug ? `/movies/${b.movieId.slug}` : '/movies'}
                          className="view-ticket-link"
                          style={{ borderColor: 'var(--accent, #00d4ff)', color: 'var(--accent, #00d4ff)' }}
                          title="Choose a new date or time for this movie"
                        >
                          Reschedule
                        </Link>
                        <button
                          type="button"
                          className="cancel-ticket-btn"
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancelBooking(b._id)}
                        >
                          {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
