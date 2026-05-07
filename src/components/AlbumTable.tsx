import type { Album } from "../types/album";
import { formatRatingPercentage } from "../utils/scoring";

type AlbumTableProps = {
  albums: Album[];
  emptyMessage: string;
  onDelete: (albumId: string) => void;
  onEdit: (albumId: string) => void;
};

export function AlbumTable({
  albums,
  emptyMessage,
  onDelete,
  onEdit,
}: AlbumTableProps) {
  if (albums.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Artist</th>
            <th>Album</th>
            <th>Year</th>
            <th>Tracks</th>
            <th>Gut %</th>
            <th>Song %</th>
            <th>Consistency %</th>
            <th>Overall %</th>
            <th>Status</th>
            <th>Favorite</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {albums.map((album, index) => (
            <tr key={album.id}>
              <td data-label="Rank">{album.overallRating === "" ? "-" : index + 1}</td>
              <td data-label="Artist">{album.artist}</td>
              <td data-label="Album">{album.title}</td>
              <td data-label="Year">{album.year || "-"}</td>
              <td data-label="Tracks">
                {album.ratedTrackCount || "-"}
                {album.officialTrackCount ? ` (${album.officialTrackCount})` : ""}
              </td>
              <td data-label="Gut %">{formatRatingPercentage(album.gutRating)}</td>
              <td data-label="Song %">{formatRatingPercentage(album.songRating)}</td>
              <td data-label="Consistency %">{formatRatingPercentage(album.consistencyRating)}</td>
              <td className="score" data-label="Overall %">
                {formatRatingPercentage(album.overallRating)}
              </td>
              <td data-label="Status">{album.status}</td>
              <td data-label="Favorite">{album.favorite ? "Yes" : "No"}</td>
              <td data-label="Actions">
                <div className="action-row">
                  <button onClick={() => onEdit(album.id)}>Edit</button>
                  <button className="danger" onClick={() => onDelete(album.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
