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
              <td>{album.overallRating === "" ? "-" : index + 1}</td>
              <td>{album.artist}</td>
              <td>{album.title}</td>
              <td>{album.year || "-"}</td>
              <td>
                {album.ratedTrackCount || "-"}
                {album.officialTrackCount ? ` (${album.officialTrackCount})` : ""}
              </td>
              <td>{formatRatingPercentage(album.gutRating)}</td>
              <td>{formatRatingPercentage(album.songRating)}</td>
              <td>{formatRatingPercentage(album.consistencyRating)}</td>
              <td className="score">{formatRatingPercentage(album.overallRating)}</td>
              <td>{album.status}</td>
              <td>{album.favorite ? "Yes" : "No"}</td>
              <td>
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
