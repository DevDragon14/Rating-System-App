import { useLayoutEffect, useRef, useState } from "react";
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
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<string>>(
    () => new Set(),
  );
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const pendingScrollAnchorId = useRef<string | null>(null);
  const allCardsExpanded =
    albums.length > 0 && albums.every((album) => expandedAlbumIds.has(album.id));

  useLayoutEffect(() => {
    if (!pendingScrollAnchorId.current) {
      return;
    }

    rowRefs.current
      .get(pendingScrollAnchorId.current)
      ?.scrollIntoView({ block: "start" });
    pendingScrollAnchorId.current = null;
  }, [expandedAlbumIds]);

  if (albums.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  function toggleAlbumCard(albumId: string) {
    rememberScrollAnchor();
    setExpandedAlbumIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(albumId)) {
        nextIds.delete(albumId);
      } else {
        nextIds.add(albumId);
      }

      return nextIds;
    });
  }

  function toggleAllCards() {
    rememberScrollAnchor();
    setExpandedAlbumIds(
      allCardsExpanded ? new Set() : new Set(albums.map((album) => album.id)),
    );
  }

  function rememberScrollAnchor() {
    const visibleRows = Array.from(rowRefs.current.entries())
      .map(([albumId, row]) => ({
        albumId,
        bottom: row.getBoundingClientRect().bottom,
        top: Math.abs(row.getBoundingClientRect().top),
      }))
      .filter((row) => row.bottom > 0)
      .sort((first, second) => first.top - second.top);

    pendingScrollAnchorId.current = visibleRows[0]?.albumId ?? null;
  }

  return (
    <>
      <div className="mobile-list-controls">
        <button type="button" onClick={toggleAllCards}>
          {allCardsExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

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
            {albums.map((album, index) => {
              const isExpanded = expandedAlbumIds.has(album.id);

              return (
                <tr
                  className={`album-row ${isExpanded ? "is-expanded" : ""}`}
                  key={album.id}
                  ref={(row) => {
                    if (row) {
                      rowRefs.current.set(album.id, row);
                    } else {
                      rowRefs.current.delete(album.id);
                    }
                  }}
                >
                  <td className="rank-cell" data-label="Rank">
                    <span className="rank-value">
                      {album.overallRating === "" ? "-" : index + 1}
                    </span>
                    <button
                      className="mobile-card-toggle"
                      type="button"
                      onClick={() => toggleAlbumCard(album.id)}
                    >
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                  </td>
                  <td className="artist-cell" data-label="Artist">
                    {album.artist}
                  </td>
                  <td className="album-cell" data-label="Album">
                    {album.title}
                  </td>
                  <td className="meta-cell" data-label="Year">
                    {album.year || "-"}
                  </td>
                  <td className="meta-cell" data-label="Tracks">
                    {album.ratedTrackCount || "-"}
                    {album.officialTrackCount ? ` (${album.officialTrackCount})` : ""}
                  </td>
                  <td className="score-cell" data-label="Gut %">
                    {formatRatingPercentage(album.gutRating)}
                  </td>
                  <td className="score-cell" data-label="Song %">
                    {formatRatingPercentage(album.songRating)}
                  </td>
                  <td className="score-cell" data-label="Consistency %">
                    {formatRatingPercentage(album.consistencyRating)}
                  </td>
                  <td className="score score-cell overall-cell" data-label="Overall %">
                    {formatRatingPercentage(album.overallRating)}
                  </td>
                  <td className="meta-cell" data-label="Status">
                    {album.status}
                  </td>
                  <td className="meta-cell" data-label="Favorite">
                    {album.favorite ? "Yes" : "No"}
                  </td>
                  <td className="actions-cell" data-label="Actions">
                    <div className="action-row">
                      <button onClick={() => onEdit(album.id)}>Edit</button>
                      <button className="danger" onClick={() => onDelete(album.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
