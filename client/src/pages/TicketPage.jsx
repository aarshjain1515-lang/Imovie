import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import bookingService from '../services/bookingService';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import './TicketPage.css';

export default function TicketPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    bookingService
      .getById(bookingId)
      .then((res) => {
        if (isMounted) setBooking(res.data?.data);
      })
      .catch((err) => {
        console.error('Failed to load ticket:', err);
        if (isMounted) setError('Unable to find this booking.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="ticket-page-container" style={{ padding: '64px 24px' }}>
        <Skeleton variant="card" height="420px" style={{ maxWidth: 440, margin: '0 auto' }} />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="ticket-page-container" style={{ padding: '64px 24px' }}>
        <ErrorState message={error || 'Ticket not found'} />
      </div>
    );
  }

  const seatList = Array.isArray(booking.seats) ? booking.seats : [];
  const qrPayload = JSON.stringify({
    bookingId: booking._id || booking.bookingId || 'IMV-TICKET',
    seats: seatList.map((s) => `${s.row}${s.number}`),
    showId: booking.showId?._id || booking.showId || 'show-1',
  });

  return (
    <div className="ticket-page">
      <div className="ticket-page-container">
        <div className="ticket-card">
          <div className="ticket-status-pill">
            ✓ Booking Confirmed
          </div>

          <h1 className="ticket-movie-title">{booking.movieId?.title}</h1>
          <p className="ticket-booking-ref">Booking ID: {booking._id}</p>

          <div className="ticket-qr-wrapper">
            <QRCodeSVG
              value={qrPayload}
              size={140}
              level="M"
              fgColor="#111111"
              bgColor="#ffffff"
            />
          </div>
          <p className="ticket-scan-hint">Show this QR at the cinema entrance</p>

          <div className="ticket-details-grid">
            <div className="detail-cell">
              <span className="cell-label">THEATRE</span>
              <span className="cell-value">{booking.theatreId?.name || 'Cinema'}</span>
            </div>
            <div className="detail-cell">
              <span className="cell-label">SHOWTIME</span>
              <span className="cell-value">
                {booking.showId?.time || 'Show'} • {booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
            <div className="detail-cell">
              <span className="cell-label">SEATS</span>
              <span className="cell-value">
                {seatList.length > 0 ? seatList.map((s) => `${s.row}${s.number}`).join(', ') : 'General'}
              </span>
            </div>
            <div className="detail-cell">
              <span className="cell-label">TOTAL PAID</span>
              <span className="cell-value">₹{booking.totalAmount}</span>
            </div>
          </div>

          <div className="ticket-actions">
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              Print Ticket
            </Button>
            <Link to="/my-tickets" className="link-button">
              View all tickets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
