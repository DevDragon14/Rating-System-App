import { useEffect, useMemo, useRef, useState } from "react";
import { saveAlbums, loadAlbums } from "./data/albumStorage";
import { AlbumForm } from "./components/AlbumForm";
import { AlbumTable } from "./components/AlbumTable";
import { ImportExportControls } from "./components/ImportExportControls";
import { SearchAndSort } from "./components/SearchAndSort";
import type {
  Album,
  FavoriteFilter,
  SortKey,
  StatusFilter,
  YearFilter,
} from "./types/album";
import { calculateOverallRating, calculateSongRating } from "./utils/scoring";

type Page = "library" | "rankings" | "queue";

function App() {
  const [albums, setAlbums] = useState<Album[]>(() => loadAlbums());
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<Page>("library");
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("overallRating");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>("All");
  const [albumYearFilter, setAlbumYearFilter] = useState<YearFilter>("All");
  const [reviewYearFilter, setReviewYearFilter] = useState<YearFilter>("All");
  const formAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveAlbums(albums);
  }, [albums]);

  const editingAlbum = albums.find((album) => album.id === editingAlbumId);

  const albumYears = useMemo(
    () => getUniqueYears(albums, (album) => album.year),
    [albums],
  );
  const reviewYears = useMemo(
    () => getUniqueYears(albums, (album) => getYearFromDate(album.createdAt)),
    [albums],
  );

  const visibleAlbums = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    let pageAlbums = [...albums];

    if (activePage === "rankings") {
      pageAlbums = pageAlbums.filter((album) => album.status === "Reviewed");
    }

    if (activePage === "queue") {
      pageAlbums = pageAlbums.filter((album) => album.status !== "Reviewed");
    }

    if (normalizedSearch) {
      pageAlbums = pageAlbums.filter((album) => {
        const searchableText = `${album.artist} ${album.title}`.toLowerCase();
        return searchableText.includes(normalizedSearch);
      });
    }

    if (statusFilter !== "All") {
      pageAlbums = pageAlbums.filter((album) => album.status === statusFilter);
    }

    if (favoriteFilter === "Favorites") {
      pageAlbums = pageAlbums.filter((album) => album.favorite);
    }

    if (albumYearFilter !== "All") {
      pageAlbums = pageAlbums.filter((album) => album.year === albumYearFilter);
    }

    if (reviewYearFilter !== "All") {
      pageAlbums = pageAlbums.filter(
        (album) => getYearFromDate(album.createdAt) === reviewYearFilter,
      );
    }

    return sortAlbums(pageAlbums, sortKey);
  }, [
    albums,
    activePage,
    searchText,
    sortKey,
    statusFilter,
    favoriteFilter,
    albumYearFilter,
    reviewYearFilter,
  ]);

  function saveAlbum(albumToSave: Album) {
    const calculatedSongRating = calculateSongRating(albumToSave.tracks);
    const songRating =
      calculatedSongRating === "" ? albumToSave.songRating : calculatedSongRating;
    const albumWithScores = {
      ...albumToSave,
      songRating,
      overallRating: calculateOverallRating({ ...albumToSave, songRating }),
      updatedAt: new Date().toISOString(),
    };

    setAlbums((currentAlbums) => {
      const exists = currentAlbums.some((album) => album.id === albumWithScores.id);

      if (exists) {
        return currentAlbums.map((album) =>
          album.id === albumWithScores.id ? albumWithScores : album,
        );
      }

      return [...currentAlbums, albumWithScores];
    });

    setEditingAlbumId(null);
  }

  function deleteAlbum(albumId: string) {
    const album = albums.find((item) => item.id === albumId);
    const confirmed = window.confirm(`Delete "${album?.title ?? "this album"}"?`);

    if (confirmed) {
      setAlbums((currentAlbums) =>
        currentAlbums.filter((item) => item.id !== albumId),
      );
    }
  }

  function editAlbum(albumId: string) {
    setEditingAlbumId(albumId);
    window.requestAnimationFrame(() => {
      formAreaRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function importAlbums(importedAlbums: Album[]) {
    const knownAlbumKeys = new Set(albums.map(getAlbumImportKey));
    let duplicateCount = 0;
    const newAlbums = importedAlbums.filter((album) => {
      const albumKey = getAlbumImportKey(album);

      if (knownAlbumKeys.has(albumKey)) {
        duplicateCount += 1;
        return false;
      }

      knownAlbumKeys.add(albumKey);
      return true;
    });
    const importedCount = newAlbums.length;

    setAlbums((currentAlbums) => [...currentAlbums, ...newAlbums]);
    return { importedCount, duplicateCount };
  }

  function clearLibrary() {
    const confirmed = window.confirm(
      "Clear all saved albums from this browser? Export a CSV first if you want a backup.",
    );

    if (!confirmed) {
      return;
    }

    setAlbums([]);
    setEditingAlbumId(null);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local-first MVP</p>
          <h1>Hip-Hop Album Ranker</h1>
        </div>
        <nav className="tabs" aria-label="Main views">
          <button className={activePage === "library" ? "active" : ""} onClick={() => setActivePage("library")}>
            Library
          </button>
          <button className={activePage === "rankings" ? "active" : ""} onClick={() => setActivePage("rankings")}>
            Rankings
          </button>
          <button className={activePage === "queue" ? "active" : ""} onClick={() => setActivePage("queue")}>
            Queue
          </button>
        </nav>
      </header>

      <section className="workspace">
        <div ref={formAreaRef}>
          <AlbumForm
            album={editingAlbum}
            onCancelEdit={() => setEditingAlbumId(null)}
            onSave={saveAlbum}
          />
        </div>

        <section className="table-area">
          <ImportExportControls
            albums={albums}
            onClearLibrary={clearLibrary}
            onImport={importAlbums}
          />
          <SearchAndSort
            searchText={searchText}
            sortKey={sortKey}
            statusFilter={statusFilter}
            favoriteFilter={favoriteFilter}
            albumYearFilter={albumYearFilter}
            reviewYearFilter={reviewYearFilter}
            albumYears={albumYears}
            reviewYears={reviewYears}
            onSearchChange={setSearchText}
            onSortChange={setSortKey}
            onStatusFilterChange={setStatusFilter}
            onFavoriteFilterChange={setFavoriteFilter}
            onAlbumYearFilterChange={setAlbumYearFilter}
            onReviewYearFilterChange={setReviewYearFilter}
          />
          <AlbumTable
            albums={visibleAlbums}
            emptyMessage={getEmptyMessage(activePage)}
            onDelete={deleteAlbum}
            onEdit={editAlbum}
          />
        </section>
      </section>
    </main>
  );
}

function sortAlbums(albums: Album[], sortKey: SortKey): Album[] {
  return albums.sort((first, second) => {
    if (sortKey === "overallRating") {
      return numericSort(second.overallRating, first.overallRating);
    }

    if (sortKey === "year") {
      return numericSort(second.year, first.year);
    }

    if (sortKey === "favorite") {
      return Number(second.favorite) - Number(first.favorite);
    }

    return String(first[sortKey]).localeCompare(String(second[sortKey]));
  });
}

function numericSort(first: number | "", second: number | ""): number {
  if (first === "" && second === "") {
    return 0;
  }

  if (first === "") {
    return -1;
  }

  if (second === "") {
    return 1;
  }

  return first - second;
}

function getEmptyMessage(activePage: Page): string {
  if (activePage === "rankings") {
    return "No reviewed albums yet. Rankings only show albums marked Reviewed.";
  }

  if (activePage === "queue") {
    return "No albums waiting for review.";
  }

  return "No albums yet. Add the first one with the form.";
}

function getAlbumImportKey(album: Album): string {
  return `${normalizeImportText(album.artist)}|${normalizeImportText(album.title)}|${album.year}`;
}

function normalizeImportText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getUniqueYears(
  albums: Album[],
  getYear: (album: Album) => number | "",
): number[] {
  const years = albums
    .map(getYear)
    .filter((year): year is number => typeof year === "number");

  return [...new Set(years)].sort((first, second) => second - first);
}

function getYearFromDate(dateText: string): number | "" {
  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.getFullYear();
}

export default App;
