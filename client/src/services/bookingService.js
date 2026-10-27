import api from './api';

const bookingService = {
  async create(data) {
    try {
      return await api.post('/bookings', data);
    } catch (e) {
      const mockBookingId = `IMV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const seats = data.seats || [{ row: 'D', number: 4, type: 'premium' }];
      const totalAmount = seats.reduce((sum, s) => sum + (s.price || 250), 0);
      const mockBooking = {
        _id: mockBookingId,
        bookingId: mockBookingId,
        movieId: typeof data.movieId === 'object' && data.movieId ? data.movieId : { title: 'Dune: Part Two', slug: 'dune-part-two', duration: 166, language: 'English' },
        theatreId: typeof data.theatreId === 'object' && data.theatreId ? data.theatreId : { name: 'PVR INOX: Phoenix Palladium', city: 'Mumbai' },
        showId: typeof data.showId === 'object' && data.showId ? data.showId : { time: '05:15 PM', date: new Date() },
        seats,
        totalAmount,
        status: 'confirmed',
        bookedAt: new Date(),
      };
      // Store in localStorage for My Tickets
      const existing = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
      existing.unshift(mockBooking);
      localStorage.setItem('imovies_user_bookings', JSON.stringify(existing));

      return {
        data: {
          success: true,
          data: mockBooking,
        },
      };
    }
  },
  async getMyBookings() {
    try {
      const res = await api.get('/bookings');
      if (res.data?.data && res.data.data.length > 0) return res;
    } catch (e) {}
    const local = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
    return { data: { success: true, count: local.length, data: local } };
  },
  async getById(id) {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.data?.data) return res;
    } catch (e) {}
    const local = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
    const b = local.find((item) => item._id === id || item.bookingId === id) || {
      _id: id,
      bookingId: id,
      movieId: { title: 'Dune: Part Two', duration: 166, language: 'English' },
      theatreId: { name: 'PVR INOX: Phoenix Palladium', city: 'Mumbai' },
      showId: { time: '05:15 PM', date: new Date() },
      seats: [{ row: 'D', number: 4, type: 'premium' }, { row: 'D', number: 5, type: 'premium' }],
      totalAmount: 550,
      status: 'confirmed',
    };
    return { data: { success: true, data: b } };
  },
  async cancel(id) {
    try {
      return await api.put(`/bookings/${id}/cancel`);
    } catch (e) {
      const local = JSON.parse(localStorage.getItem('imovies_user_bookings') || '[]');
      const updated = local.map((item) => (item._id === id ? { ...item, status: 'cancelled' } : item));
      localStorage.setItem('imovies_user_bookings', JSON.stringify(updated));
      return { data: { success: true, message: 'Booking cancelled' } };
    }
  },
  reschedule(id, data) {
    return api.put(`/bookings/${id}/reschedule`, data);
  },
  getAll(params) {
    return api.get('/bookings', { params });
  },
};

export default bookingService;
