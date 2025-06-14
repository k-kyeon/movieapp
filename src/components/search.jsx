const Search = ({ searchTerm, setSearchTerm, onSearch }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search">
      <div>
        <input
          type="text"
          placeholder="Search for any movie or check out trending movies below!"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <img src="search.png" alt="Search" onClick={onSearch} />
      </div>
    </div>
  );
};

export default Search;
