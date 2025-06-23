import { useRef, useState } from "react";
import Search from "./components/Search";
import { useEffect } from "react";
import { FadeLoader } from "react-spinners";
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite";
import Footer from "./components/Footer";

const API_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultMovieList, setDefaultMovieList] = useState([]);

  const [trendingMovies, setTrendingMovies] = useState([]);

  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreMovies, setGenreMovies] = useState([]);

  const [hasSearched, setHasSearched] = useState(false);

  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [youtubeKey, setYoutubeKey] = useState(null);

  const genreSectionRef = useRef(null);

  const fetchGenres = async () => {
    try {
      const endpoint = `${API_URL}/genre/movie/list?language=en`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch genres");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch genres");
        setGenres([]);
        return;
      }

      setGenres(data.genres || []);
    } catch (error) {
      console.error(`Error fetching genres: ${error}`);
    }
  };

  const fetchMoviesByGenre = async (genre_id) => {
    try {
      const endpoint = `${API_URL}/discover/movie?with_genres=${genre_id}&sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies by genre");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies by genre");
        setGenreMovies([]);
        return;
      }

      setGenreMovies(data.results || []);
    } catch (error) {
      console.error(`Error fetching movies by genre: ${error}`);
    }
  };

  const fetchUpcomingMovies = async () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const future = thirtyDaysFromNow.toISOString().split("T")[0];

    try {
      const endpoint = `${API_URL}/discover/movie?language=en-US&page=1&sort_by=primary_release_date.asc&with_release_type=2|3&primary_release_date.gte=${today}&primary_release_date.lte=${future}`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch upcoming movies");
      }

      const data = await response.json();
      const filtered = (data.results || []).filter(
        (movie) => movie.poster_path
      );

      setUpcomingMovies(filtered);
    } catch (error) {
      console.error(`Error fetching upcoming movies: ${error}`);
    }
  };

  const fetchMovieTrailer = async (movieId) => {
    try {
      const response = await fetch(
        `${API_URL}/movie/${movieId}/videos`,
        API_OPTIONS
      );
      const data = await response.json();

      // Find YouTube trailer (can also check for type === "Teaser")
      const trailer = data.results.find(
        (video) => video.site === "YouTube" && video.type === "Trailer"
      );

      return trailer?.key || null; // YouTube video key
    } catch (err) {
      console.error("Failed to fetch trailer:", err);
      return null;
    }
  };

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovieList([]);
        return;
      }

      if (query && data.results.length > 0) {
        setMovieList(data.results || []);
        await updateSearchCount(query, data.results[0]);
      } else {
        setDefaultMovieList(data.results || []);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage("Error fetching movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  useEffect(() => {
    fetchGenres();
    loadTrendingMovies();
    fetchMovies();
    fetchUpcomingMovies();
  }, []);

  useEffect(() => {
    if (showModal && selectedMovie) {
      fetchMovieTrailer(selectedMovie.id).then((key) => {
        setYoutubeKey(key); // state: const [youtubeKey, setYoutubeKey] = useState(null);
      });
    }
  }, [showModal, selectedMovie]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    fetchMovies(searchTerm.trim());
    setSelectedGenre(null); // override genre
    setHasSearched(true);
  };

  return (
    <main>
      <div className="curtain" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Love
            Within Seconds
          </h1>
          <Search
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
          />
        </header>

        {genres.length > 0 && (
          <section className="genres">
            <h2>Genres</h2>

            <ul>
              {genres.map((g) => {
                const isSelected = selectedGenre?.id === g.id;

                return (
                  <li
                    key={g.id}
                    onClick={() => {
                      setSelectedGenre(g);
                      fetchMoviesByGenre(g.id);
                      setHasSearched(false);
                      setSearchTerm("");

                      setTimeout(() => {
                        genreSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      });
                    }}
                    className={`cursor-pointer transition rounded-2xl border ${
                      isSelected
                        ? "bg-blue-950 text-black border-blue-700"
                        : "hover:bg-light-200 border-slate-700 text-white"
                    }`}
                  >
                    <p>{g.name}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {upcomingMovies.length > 0 && (
          <section className="upcoming">
            <h2>Upcoming Movies</h2>

            <ul>
              {upcomingMovies.map((movie) => (
                <li
                  key={movie.id}
                  onClick={() => {
                    setSelectedMovie(movie);
                    setShowModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <p>{movie.title}</p>
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
                      alt={movie.title}
                    />
                  ) : (
                    <img src="no-poster.png" />
                  )}
                  <p>{movie.release_date}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showModal && selectedMovie && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col w-full">
                <h2>{selectedMovie.title}</h2>
                <div className="flex gap-x-5">
                  {selectedMovie.poster_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w500/${selectedMovie.poster_path}`}
                      alt={selectedMovie.title}
                      className="rounded-lg shadow-sm shadow-blue-dark-100"
                    />
                  )}
                  <div className="w-full min-w-[200px] border rounded-xl text-white bg-blue-dark-100 p-4">
                    <div className="flex justify-between mb-2">
                      <p>
                        Release Date:{" "}
                        <span className="text-yellow-500">
                          {selectedMovie.release_date}
                        </span>
                      </p>
                      <button
                        onClick={() => setShowModal(false)}
                        className="cursor-pointer text-red-300"
                      >
                        Close
                      </button>
                    </div>
                    {youtubeKey ? (
                      <iframe
                        width="100%"
                        height="300"
                        src={`https://www.youtube.com/embed/${youtubeKey}`}
                        title="Trailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="mb-3 rounded-2xl shadow-sm shadow-white"
                      ></iframe>
                    ) : (
                      <p className="my-2">No trailer available.</p>
                    )}
                    <p>
                      {selectedMovie.overview || "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="all-movies" ref={genreSectionRef}>
          <div className="heading-container">
            <h2>
              {selectedGenre ? `${selectedGenre.name} Movies` : "All Movies"}
            </h2>

            {selectedGenre && (
              <button
                className="genre-reset-button"
                onClick={() => {
                  setSelectedGenre(null);
                  setHasSearched(false);
                  setSearchTerm("");
                  fetchMovies(); // Go back to default all movies
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Clear Genre Filter
              </button>
            )}
          </div>

          {isLoading ? (
            <FadeLoader color="#ffffff" />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {(hasSearched
                ? movieList // search result
                : selectedGenre
                ? genreMovies // genre selected
                : defaultMovieList
              ) // fallback default
                .map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
            </ul>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
};

export default App;
