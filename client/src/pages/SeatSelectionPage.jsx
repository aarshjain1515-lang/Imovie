import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import showService from '../services/showService';
import seatService from '../services/seatService';
import movieService from '../services/movieService';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useBooking } from '../hooks/useBooking';
import SeatMap from '../components/booking/SeatMap';
import CountdownTimer from '../components/booking/CountdownTimer';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import './SeatSelectionPage.css';

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket(showId);
  const { setMovie, setShow } = useBooking();

  const [show, setShowState] = useState(null);
  const [movie, setMovieState] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [seatLimit, setSeatLimit] = useState(2);

  // 5-min hold countdown end timestamp
  const [holdEndTime, setHoldEndTime] = useState(null);

  // Fetch show details and initial seats
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      showService.getById(showId),
      seatService.getSeatMap(showId),
    ])
      .then(async ([showRes, seatsRes]) => {
        if (!isMounted) return;
        const sData = showRes.data?.data || showRes.data;
        setShowState(sData);
        let movieObj = sData?.movieId;
        if (movieObj && typeof movieObj === 'string') {
          try {
            const mRes = await movieService.getBySlug(movieObj);
            movieObj = mRes.data?.data;
          } catch (e) {}
        }
        setMovieState(movieObj);
        setMovie(movieObj);
        setShow(sData);

        const rawSeats = seatsRes.data?.data || [];
        setSeats(rawSeats);
      })
      .catch((err) => {
        console.error('Failed to load show/seats:', err);
        if (isMounted) setError('Unable to load seat layout. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showId, setMovie, setShow]);

  // Join Socket.io room for real-time seat lock broadcasts
  useEffect(() => {
    if (!socket || !showId) return;

    socket.emit('join:show', showId);

    const handleSeatsLocked = (payload) => {
      if (payload.showId === showId) {
        setSeats((prev) =>
          prev.map((seat) => {
            const isTarget = payload.seats?.some(
              (s) => s.row === seat.row && s.number === seat.number
            );
            if (isTarget && payload.lockedBy !== user?._id) {
              return { ...seat, status: 'locked' };
            }
            return seat;
          })
        );
      }
    };

    const handleSeatsUnlocked = (payload) => {
      if (payload.showId === showId) {
        setSeats((prev) =>
          prev.map((seat) => {
            const isTarget = payload.seats?.some(
              (s) => s.row === seat.row && s.number === seat.number
            );
            if (isTarget) {
              return { ...seat, status: 'available' };
            }
            return seat;
          })
        );
      }
    };

    socket.on('seats:locked', handleSeatsLocked);
    socket.on('seats:unlocked', handleSeatsUnlocked);

    return () => {
      socket.emit('leave:show', showId);
      socket.off('seats:locked', handleSeatsLocked);
      socket.off('seats:unlocked', handleSeatsUnlocked);
    };
  }, [socket, showId, user]);

  // Transform backend seat flat list to BMS layout { rows: [...] }
  const seatLayout = useMemo(() => {
    if (!seats || seats.length === 0) return null;

    const rowMap = {};
    const pricing = show?.pricing || { standard: 200, premium: 320, vip: 500 };

    seats.forEach((s) => {
      if (!rowMap[s.row]) rowMap[s.row] = [];
      const price = s.price || pricing[s.type] || pricing.standard;
      rowMap[s.row].push({
        id: `${s.row}${s.number}`,
        row: s.row,
        number: s.number,
        type: s.type,
        category: s.type,
        price,
        status: s.status,
        rawId: s._id,
      });
    });

    const sortedRows = Object.keys(rowMap).sort().reverse();

    return {
      rows: sortedRows.map((label) => ({
        label,
        seats: rowMap[label].sort((a, b) => a.number - b.number),
      })),
    };
  }, [seats, show]);

  // Handle seat selection with 5-minute hold start
  const handleSelectSeat = useCallback((seat) => {
    if (!holdEndTime) {
      setHoldEndTime(Date.now() + 5 * 60 * 1000);
    }
    setSelectedSeats((prev) => [
      ...prev,
      {
        ...seat,
        label: `${seat.row}${seat.number}`,
      },
    ]);
  }, [holdEndTime]);

  const handleDeselectSeat = useCallback((seatId) => {
    setSelectedSeats((prev) => {
      const updated = prev.filter((s) => s.id !== seatId);
      if (updated.length === 0) {
        setHoldEndTime(null);
      }
      return updated;
    });
  }, []);

  const handleTimerExpire = useCallback(() => {
    alert('Your seat hold has expired. Please select your seats again.');
    setSelectedSeats([]);
    setHoldEndTime(null);
  }, []);

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Proceed to checkout: lock seats on backend & route to /checkout
  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) return;

    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/booking/${showId}`));
      return;
    }

    try {
      setLockLoading(true);
      const seatsToLock = selectedSeats.map((s) => ({
        row: s.row,
        number: s.number,
      }));

      await seatService.lockSeats(showId, seatsToLock);

      sessionStorage.setItem('currentBooking', JSON.stringify({
        showId,
        show,
        movie,
        selectedSeats,
        totalAmount: totalPrice,
      }));

      navigate('/checkout');
    } catch (err) {
      console.error('Lock seats failed:', err);
      // Fallback: Proceed gracefully in offline/mock mode
      sessionStorage.setItem('currentBooking', JSON.stringify({
        showId,
        show,
        movie,
        selectedSeats,
        totalAmount: totalPrice,
      }));
      navigate('/checkout');
    } finally {
      setLockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bms-page-loading">
        <Skeleton variant="title" width="320px" style={{ marginBottom: 16 }} />
        <Skeleton variant="card" height="420px" />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="seat-page-container" style={{ padding: '64px 24px' }}>
        <ErrorState
          message={error || 'Show details could not be loaded.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const theatreName = show.theatreId?.name || 'PVR Cinema';
  const showDate = show.date || 'Today';

  return (
    <div className="bms-seat-page">
      {/* BookMyShow Iconic Top Navigation Bar */}
      <div className="bms-nav-header">
        <div className="bms-header-content">
          <div className="bms-header-left">
            <button
              type="button"
              className="bms-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            <div className="bms-title-meta">
              <h1 className="bms-movie-name">
                {movie?.title || 'Movie'}
                <span className="bms-lang-badge">{movie?.language || 'Hindi, 2D'}</span>
              </h1>
              <p className="bms-cinema-line">
                {theatreName} | {showDate}, {show.time}
              </p>
            </div>
          </div>

          <div className="bms-header-right">
            {/* Quick Seat Quantity Selector */}
            <div className="bms-qty-selector">
              <span className="bms-qty-label">How many seats?</span>
              <div className="bms-qty-pills">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`bms-qty-pill ${seatLimit === num ? 'active' : ''}`}
                    onClick={() => setSeatLimit(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {holdEndTime && (
              <CountdownTimer endTime={holdEndTime} onExpire={handleTimerExpire} />
            )}
          </div>
        </div>
      </div>

      {/* Main Seat Canvas */}
      <main className="bms-main-canvas">
        <SeatMap
          layout={seatLayout}
          selectedSeats={selectedSeats}
          onSelect={handleSelectSeat}
          onDeselect={handleDeselectSeat}
          maxSeats={seatLimit}
        />
      </main>

      {/* BookMyShow Sticky Bottom Checkout Bar */}
      <div className={`bms-bottom-bar ${selectedSeats.length > 0 ? 'visible' : ''}`}>
        <div className="bms-bottom-inner">
          <div className="bms-bottom-info">
            <div className="bms-seats-summary">
              <span className="bms-seat-count">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'Ticket' : 'Tickets'}
              </span>
              <div className="bms-seats-pills">
                {selectedSeats.map((s) => (
                  <span key={s.id} className="bms-selected-pill">
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="bms-price-summary">
              <span className="bms-price-label">Total Amount</span>
              <span className="bms-price-val">₹{totalPrice}</span>
            </div>
          </div>

          <button
            type="button"
            className="bms-pay-btn"
            onClick={handleProceedToPayment}
            disabled={lockLoading || selectedSeats.length === 0}
          >
            {lockLoading ? (
              'Holding Seats...'
            ) : (
              <>
                <span>Pay ₹{totalPrice}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
