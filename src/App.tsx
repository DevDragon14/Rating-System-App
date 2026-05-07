import { useEffect, useMemo, useState } from "react";
import { saveAlbums, loadAlbums } from "./data/albumStorage";
import { AlbumForm } from "./components/AlbumForm";
import { AlbumTable } from "./components/AlbumTable";
import { ImportExportControls } from "./components/ImportExportControls";
import { SearchAndSort } from "./components/SearchAndSort";
import type { Album, SortKey } from "./types/album";
import { calculateOverallRating, calculateSongRating } from "./utils/scoring";

type Page = "library" | "rankings" | "queue";

function App() {
  const [albums, setAlbums] = useState<Album[]>(() => loadAlbums());
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<Page>("library");
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("overallRating");

  useEffect(() => {
    saveAlbums(albums);
  }, [albums]);

  const editingAlbum = albums.find((album) => album.id === editingAlbumId);

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

    return sortAlbums(pageAlbums, sortKey);
  }, [albums, activePage, searchText, sortKey]);

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
        <AlbumForm
          album={editingAlbum}
          onCancelEdit={() => setEditingAlbumId(null)}
          onSave={saveAlbum}
        />

        <section className="table-area">
          <ImportExportControls albums={albums} onImport={importAlbums} />
          <SearchAndSort
            searchText={searchText}
            sortKey={sortKey}
            onSearchChange={setSearchText}
            onSortChange={setSortKey}
          />
          <AlbumTable
            albums={visibleAlbums}
            emptyMessage={getEmptyMessage(activePage)}
            onDelete={deleteAlbum}
            onEdit={setEditingAlbumId}
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

export default App;
