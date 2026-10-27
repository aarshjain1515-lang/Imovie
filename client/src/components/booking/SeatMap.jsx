import { useCallback, useMemo } from 'react';
import './SeatMap.css';

export default function SeatMap({
  layout,
  selectedSeats = [],
  onSelect,
  onDeselect,
  maxSeats = 6,
}) {
  const handleSeatClick = useCallback(
    (seat) => {
      if (seat.status === 'booked' || seat.status === 'locked') return;

      const isSelected = selectedSeats.some((s) => s.id === seat.id);
      if (isSelected) {
        onDeselect(seat.id);
      } else {
        if (selectedSeats.length >= maxSeats) {
          alert(`You can select a maximum of ${maxSeats} seats per booking.`);
          return;
        }
        onSelect(seat);
      }
    },
    [selectedSeats, onSelect, onDeselect, maxSeats]
  );

  // Group rows into BookMyShow pricing tiers
  const tiers = useMemo(() => {
    if (!layout?.rows) return [];

    const tierGroups = [
      { name: 'RECLINER', price: 500, rows: [] },
      { name: 'PRIME', price: 320, rows: [] },
      { name: 'CLASSIC', price: 200, rows: [] },
    ];

    layout.rows.forEach((row) => {
      const sampleSeat = row.seats[0];
      const type = sampleSeat?.type || 'standard';
      if (type === 'vip') {
        tierGroups[0].rows.push(row);
      } else if (type === 'premium') {
        tierGroups[1].rows.push(row);
      } else {
        tierGroups[2].rows.push(row);
      }
    });

    return tierGroups.filter((t) => t.rows.length > 0);
  }, [layout]);

  if (!layout || !layout.rows) return null;

  return (
    <div className="bms-seat-container">
      {/* Seat Layout by BMS Tiers */}
      <div className="bms-seat-matrix">
        {tiers.map((tier) => (
          <div key={tier.name} className="bms-tier-section">
            <div className="bms-tier-header">
              <span className="bms-tier-title">{tier.name}</span>
              <span className="bms-tier-price">₹{tier.price}.00</span>
            </div>

            <div className="bms-tier-rows">
              {tier.rows.map((row) => (
                <div className="bms-row" key={row.label}>
                  <span className="bms-row-label">{row.label}</span>

                  <div className="bms-seats-row">
                    {row.seats.map((seat, sIdx) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      let seatClass = 'bms-seat';
                      if (isSelected) seatClass += ' bms-seat--selected';
                      else if (seat.status === 'booked') seatClass += ' bms-seat--booked';
                      else if (seat.status === 'locked') seatClass += ' bms-seat--locked';

                      const isAisleGap = sIdx === 4 || sIdx === 8;

                      return (
                        <div key={seat.id} className="bms-seat-wrapper">
                          {isAisleGap && <div className="bms-aisle-gap" />}
                          <button
                            type="button"
                            className={seatClass}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'booked'}
                            aria-label={`Seat ${row.label}${seat.number}, ${seat.status}`}
                            title={`${row.label}${seat.number} - ₹${seat.price}`}
                          >
                            {seat.number}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <span className="bms-row-label bms-row-label-right">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* BookMyShow Iconic Screen at Bottom */}
      <div className="bms-screen-area">
        <div className="bms-screen-glow" />
        <svg className="bms-screen-curve" viewBox="0 0 500 40" preserveAspectRatio="none">
          <path
            d="M 20 30 Q 250 5 480 30"
            stroke="var(--accent, #f43f5e)"
            strokeWidth="3"
            fill="none"
          />
        </svg>
        <p className="bms-screen-caption">All eyes this way please!</p>
      </div>

      {/* BookMyShow Seat Legend */}
      <div className="bms-legend-bar">
        <div className="bms-legend-item">
          <div className="bms-legend-box bms-legend-box--available" />
          <span>Available</span>
        </div>
        <div className="bms-legend-item">
          <div className="bms-legend-box bms-legend-box--selected" />
          <span>Selected</span>
        </div>
        <div className="bms-legend-item">
          <div className="bms-legend-box bms-legend-box--booked" />
          <span>Sold</span>
        </div>
      </div>
    </div>
  );
}
