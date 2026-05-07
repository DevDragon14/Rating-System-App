import type { Album } from "../types/album";

const STORAGE_KEY = "hip-hop-album-ranker:albums";

export function loadAlbums(): Album[] {
  const savedAlbums = window.localStorage.getItem(STORAGE_KEY);

  if (!savedAlbums) {
    return [];
  }

  try {
    const parsedAlbums = JSON.parse(savedAlbums);
    return Array.isArray(parsedAlbums) ? parsedAlbums : [];
  } catch {
    return [];
  }
}

export function saveAlbums(albums: Album[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
}
