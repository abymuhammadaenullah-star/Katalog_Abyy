import { Search, X } from 'lucide-react';

export const SearchBar = ({ search, setSearch, placeholder = 'Cari nama sparepart atau kategori...' }) => {
  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          id="product-search-input"
        />
        {search && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearch('')}
            title="Hapus pencarian"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};