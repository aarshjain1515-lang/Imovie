import { useState, useEffect } from 'react';
import { useCity } from '../hooks/useCity';
import movieService from '../services/movieService';
import FeaturedBanner from '../components/movie/FeaturedBanner';
import GenreTabs from '../components/movie/GenreTabs';
import MovieGrid from '../components/movie/MovieGrid';
import './HomePage.css';

const LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];

export default function HomePage() {
  const { city } = useCity();
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Load featured movie
  useEffect(() => {
    let isMounted = true;
    setLoadingFeatured(true);
    movieService
      .getFeatured()
      .then((res) => {
        if (isMounted) {
          const featured = Array.isArray(res.data?.data) ? res.data.data[0] : res.data?.data;
          setFeaturedMovie(featured || null);
        }
      })
      .catch((err) => {
        console.error('Failed to load featured movie:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingFeatured(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load movies for current city
  useEffect(() => {
    let isMounted = true;
    setLoadingMovies(true);
    const params = {
      city,
      status: 'now_showing',
    };
    if (activeGenre !== 'All') params.genre = activeGenre;
    if (selectedLanguage !== 'All') params.language = selectedLanguage;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    movieService
      .getAll(params)
      .then((res) => {
        if (isMounted) {
          setMovies(res.data?.data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load movies:', err);
        if (isMounted) setMovies([]);
      })
      .finally(() => {
        if (isMounted) setLoadingMovies(false);
      });

    return () => {
      isMounted = false;
    };
  }, [city, activeGenre, selectedLanguage, searchQuery]);

  return (
    <div className="home-page">
      <FeaturedBanner movie={featuredMovie} loading={loadingFeatured} />

      <section className="now-showing-section">
        <div className="section-container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-eyebrow">Now Playing</span>
              <h2 className="section-title">
                Theatres in <span className="city-highlight">{city}</span>
              </h2>
            </div>
            <div className="filters-bar">
              <GenreTabs
                active={activeGenre}
                onChange={setActiveGenre}
              />
              <div className="search-and-lang">
                <div className="search-input-wrapper">
                  <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    aria-label="Search movies"
                  />
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="language-select"
                  aria-label="Filter by language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang === 'All' ? 'All languages' : lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <MovieGrid
            movies={movies}
            loading={loadingMovies}
            emptyTitle={`No movies showing in ${city}`}
            emptyMessage="Try selecting a different genre, language, or another city from the header."
          />
        </div>
      </section>
    </div>
  );
}
