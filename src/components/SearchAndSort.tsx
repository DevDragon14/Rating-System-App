import type { SortKey } from "../types/album";

type SearchAndSortProps = {
  searchText: string;
  sortKey: SortKey;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
};

export function SearchAndSort({
  searchText,
  sortKey,
  onSearchChange,
  onSortChange,
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
    </div>
  );
}
