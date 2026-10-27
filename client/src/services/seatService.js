import api from './api';
import { generateMockSeats } from './mockData';

const seatService = {
  async getByShow(showId) {
    try {
      const res = await api.get(`/seats/show/${showId}`);
      if (res.data?.data && res.data.data.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn('Using fallback seat matrix:', e.message);
    }
    const seats = generateMockSeats(showId);
    return { data: { success: true, count: seats.length, data: seats } };
  },

  async getSeatMap(showId) {
    return this.getByShow(showId);
  },

  async lock(showId, seatIds) {
    try {
      return await api.post(`/seats/lock`, { showId, seatIds });
    } catch (e) {
      // In offline/standalone mode, accept lock
      return {
        data: {
          success: true,
          data: {
            lockedSeats: seatIds.map((s) => ({
              _id: typeof s === 'object' ? `${s.row}${s.number}` : s,
              status: 'locked',
            })),
          },
        },
      };
    }
  },

  async lockSeats(showId, seatIds) {
    return this.lock(showId, seatIds);
  },

  async unlock(showId, seatIds) {
    try {
      return await api.post(`/seats/unlock`, { showId, seatIds });
    } catch (e) {
      return { data: { success: true } };
    }
  },
};

export default seatService;
