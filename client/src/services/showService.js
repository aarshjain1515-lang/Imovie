import api from './api';
import { generateMockShows, MOCK_MOVIES } from './mockData';

const showService = {
  async getAll(params = {}) {
    try {
      const res = await api.get('/shows', { params });
      if (res.data?.data && res.data.data.length > 0) {
        return res;
      }
    } catch (e) {
      console.warn('Using fallback showtimes:', e.message);
    }
    const shows = generateMockShows(params.movieId, params.city, params.date);
    return { data: { success: true, count: shows.length, data: shows } };
  },

  async getByMovie(movieId, params = {}) {
    return this.getAll({ movieId, ...params });
  },

  async getById(showId) {
    try {
      const res = await api.get(`/shows/${showId}`);
      if (res.data?.data) {
        let show = res.data.data;
        if (typeof show.movieId === 'string') {
          const found = MOCK_MOVIES.find((m) => m._id === show.movieId || m.slug === show.movieId) || MOCK_MOVIES[0];
          show = { ...show, movieId: found };
        }
        return { data: { success: true, data: show } };
      }
    } catch (e) {}
    const shows = generateMockShows(null, 'Mumbai');
    let show = shows.find((s) => s._id === showId) || shows[0];
    if (show && typeof show.movieId === 'string') {
      const found = MOCK_MOVIES.find((m) => m._id === show.movieId || m.slug === show.movieId) || MOCK_MOVIES[0];
      show = { ...show, movieId: found };
    }
    return { data: { success: true, data: show } };
  },

  create(data) {
    return api.post('/shows', data);
  },
  update(id, data) {
    return api.put(`/shows/${id}`, data);
  },
  delete(id) {
    return api.delete(`/shows/${id}`);
  },
};

export default showService;
