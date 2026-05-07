import type {
  FavoriteFilter,
  SortKey,
  StatusFilter,
  YearFilter,
} from "../types/album";

type SearchAndSortProps = {
  searchText: string;
  sortKey: SortKey;
  statusFilter: StatusFilter;
  favoriteFilter: FavoriteFilter;
  albumYearFilter: YearFilter;
  reviewYearFilter: YearFilter;
  albumYears: number[];
  reviewYears: number[];
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onFavoriteFilterChange: (value: FavoriteFilter) => void;
  onAlbumYearFilterChange: (value: YearFilter) => void;
  onReviewYearFilterChange: (value: YearFilter) => void;
};

export function SearchAndSort({
  searchText,
  sortKey,
  statusFilter,
  favoriteFilter,
  albumYearFilter,
  reviewYearFilter,
  albumYears,
  reviewYears,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onFavoriteFilterChange,
  onAlbumYearFilterChange,
  onReviewYearFilterChange,
}: SearchAndSortProps) {
  return (
    <div className="toolbar">
      <label>
        Search
        <input
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Artist or album"
        />
      </label>

      <label>
        Sort by
        <select
          value={sortKey}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
        >
          <option value="overallRating">Overall rating</option>
          <option value="artist">Artist</option>
          <option value="year">Year</option>
          <option value="favorite">Favorite</option>
          <option value="status">Review status</option>
        </select>
      </label>

      <label>
        Status
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
        >
          <option value="All">All statuses</option>
          <option value="Planned">Planned</option>
          <option value="In Progress">In Progress</option>
          <option value="Reviewed">Reviewed</option>
        </select>
      </label>

      <label>
        Favorite
        <select
          value={favoriteFilter}
          onChange={(event) =>
            onFavoriteFilterChange(event.target.value as FavoriteFilter)
          }
        >
          <option value="All">All albums</option>
          <option value="Favorites">Favorites only</option>
        </select>
      </label>

      <label>
        Album year
        <select
          value={albumYearFilter}
          onChange={(event) =>
            onAlbumYearFilterChange(parseYearFilter(event.target.value))
          }
        >
          <option value="All">All years</option>
          {albumYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label>
        Added year
        <select
          value={reviewYearFilter}
          onChange={(event) =>
            onReviewYearFilterChange(parseYearFilter(event.target.value))
          }
        >
          <option value="All">All years</option>
          {reviewYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function parseYearFilter(value: string): YearFilter {
  return value === "All" ? "All" : Number(value);
}
