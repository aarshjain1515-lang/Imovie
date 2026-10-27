import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';
import bookingService from '../services/bookingService';
import Button from '../components/ui/Button';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('currentBooking');
    if (!raw) {
      navigate('/');
      return;
    }
    try {
      setBookingData(JSON.parse(raw));
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  if (!bookingData) return null;

  const { movie, show, selectedSeats, totalAmount, showId } = bookingData;
  const convenienceFee = 30;
  const gst = Math.round(convenienceFee * 0.18);
  const grandTotal = totalAmount + convenienceFee + gst;

  const handlePay = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Step 1: Initiate payment order on backend
      const createRes = await paymentService.createOrder({
        showId,
        seats: selectedSeats.map((s) => ({ row: s.row, number: s.number })),
        gateway: selectedGateway,
      });

      const payment = createRes.data?.data?.payment || createRes.data?.payment || { _id: `pay_${Date.now()}` };

      // Step 2: Verify payment (simulated test mode payload)
      await paymentService.verify({
        paymentId: payment._id,
        gatewayPayload: {
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_order_id: payment.gatewayPaymentId || 'order_mock',
          razorpay_signature: 'signature_verified_mock',
        },
      });

      // Step 3: Finalize booking
      const bookingRes = await bookingService.create({
        showId,
        movieId: movie?._id || movie,
        theatreId: show?.theatre?._id || show?.theatre,
        seats: selectedSeats.map((s) => ({
          row: s.row,
          number: s.number,
          type: s.type || 'standard',
        })),
        paymentId: payment._id,
      });

      const confirmedBooking = bookingRes.data?.data || bookingRes.data || { _id: `IMV-${Date.now()}` };
      sessionStorage.removeItem('currentBooking');

      navigate(`/ticket/${confirmedBooking._id || confirmedBooking.bookingId || 'latest'}`);
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Review & Pay</h1>

        {error && (
          <div className="checkout-error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="checkout-grid">
          {/* Left: Summary */}
          <div className="checkout-card">
            <div className="checkout-movie-header">
              <h2 className="checkout-movie-name">{movie?.title}</h2>
              <p className="checkout-movie-meta">
                {show?.theatre?.name || 'Cinema'} • {show?.time}
              </p>
            </div>

            <div className="checkout-breakdown">
              <div className="breakdown-row">
                <span>Selected Seats ({selectedSeats.length})</span>
                <span className="breakdown-value">
                  {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}
                </span>
              </div>
              <div className="breakdown-row">
                <span>Tickets Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="breakdown-row">
                <span>Convenience Fee</span>
                <span>₹{convenienceFee}</span>
              </div>
              <div className="breakdown-row">
                <span>GST (18%)</span>
                <span>₹{gst}</span>
              </div>

              <div className="breakdown-divider" />

              <div className="breakdown-row total-row">
                <span>Total Payable</span>
                <span className="total-amount">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Right: Payment Method & CTA */}
          <div className="checkout-card">
            <h3 className="section-subheading">Select Payment Method</h3>
            <p className="payment-mode-hint">Test mode enabled for verification</p>

            <div className="gateway-options">
              <label className={`gateway-option ${selectedGateway === 'razorpay' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gateway"
                  value="razorpay"
                  checked={selectedGateway === 'razorpay'}
                  onChange={() => setSelectedGateway('razorpay')}
                />
                <div className="gateway-text">
                  <div className="gateway-name">Razorpay</div>
                  <div className="gateway-sub">UPI, Credit/Debit Card, Netbanking</div>
                </div>
              </label>

              <label className={`gateway-option ${selectedGateway === 'stripe' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gateway"
                  value="stripe"
                  checked={selectedGateway === 'stripe'}
                  onChange={() => setSelectedGateway('stripe')}
                />
                <div className="gateway-text">
                  <div className="gateway-name">Stripe</div>
                  <div className="gateway-sub">International Visa, Mastercard</div>
                </div>
              </label>
            </div>

            <Button
              block
              disabled={processing}
              onClick={handlePay}
              style={{ marginTop: 24 }}
            >
              {processing ? 'Confirming seats & paying...' : `Pay ₹${grandTotal}`}
            </Button>

            <p className="secure-note">
              🔒 256-bit SSL encrypted. Non-refundable after show commencement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
