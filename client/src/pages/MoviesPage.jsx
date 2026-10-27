import { useState, useEffect } from 'react';
import movieService from '../services/movieService';
import MovieGrid from '../components/movie/MovieGrid';
import GenreTabs from '../components/movie/GenreTabs';
import './MoviesPage.css';

const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = {};
    if (genre !== 'All') params.genre = genre;
    if (language !== 'All') params.language = language;
    if (search.trim()) params.search = search.trim();

    movieService
      .getAll(params)
      .then((res) => {
        if (isMounted) setMovies(res.data?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load movies:', err);
        if (isMounted) setMovies([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [genre, language, search]);

  return (
    <div className="movies-page">
      <div className="movies-page-container">
        <header className="movies-page-header">
          <span className="movies-page-eyebrow">Cinema Catalog</span>
          <h1 className="movies-page-title">All Movies</h1>
          <p className="movies-page-desc">
            Explore now-showing blockbusters and upcoming theatrical releases.
          </p>

          <div className="movies-controls-bar">
            <GenreTabs active={genre} onChange={setGenre} />
            <div className="movies-filter-tools">
              <div className="movies-search-input-wrapper">
                <svg className="movies-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="movies-search-input"
                  aria-label="Search by title"
                />
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="movies-lang-select"
                aria-label="Filter by language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l === 'All' ? 'All languages' : l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <MovieGrid
          movies={movies}
          loading={loading}
          emptyTitle="No movies found"
          emptyMessage="No movie matches the current filters. Clear the search or choose another genre."
        />
      </div>
    </div>
  );
}
