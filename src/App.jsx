import { useState } from "react";
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
  }, []);

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
                    }}
                    className={`cursor-pointer transition rounded-2xl border ${
                      isSelected
                        ? "bg-blue-950 text-black border-blue-700"
                        : "hover:bg-light-200 border-blue-950 text-white"
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

        <section className="all-movies">
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
