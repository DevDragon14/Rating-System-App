import type { Album, TrackRating } from "../types/album";

const RATING_STEP = 0.25;

export function isValidRating(value: number): boolean {
  return value >= 1 && value <= 11 && Number.isInteger(value / RATING_STEP);
}

export function averageRatings(ratings: number[]): number | "" {
  if (ratings.length === 0) {
    return "";
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return roundToTwoDecimals(total / ratings.length);
}

export function calculateSongRating(tracks: TrackRating[]): number | "" {
  const ratedTracks = tracks.filter(
    (track) => !track.skipped && typeof track.rating === "number",
  );

  return averageRatings(ratedTracks.map((track) => track.rating as number));
}

export function calculateOverallRating(album: Pick<Album, "gutRating" | "songRating" | "consistencyRating">): number | "" {
  const ratings = [album.gutRating, album.songRating, album.consistencyRating];

  if (ratings.some((rating) => typeof rating !== "number")) {
    return "";
  }

  return averageRatings(ratings as number[]);
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
