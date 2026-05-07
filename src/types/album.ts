export type ReviewStatus = "Planned" | "In Progress" | "Reviewed";
export type StatusFilter = "All" | ReviewStatus;
export type FavoriteFilter = "All" | "Favorites";
export type YearFilter = "All" | number;

export type TrackRating = {
  id: string;
  trackNumber: number;
  title: string;
  rating: number | "";
  skipped: boolean;
};

export type Album = {
  id: string;
  artist: string;
  title: string;
  year: number | "";
  ratedTrackCount: number | "";
  officialTrackCount: number | "";
  favorite: boolean;
  status: ReviewStatus;
  gutRating: number | "";
  songRating: number | "";
  consistencyRating: number | "";
  overallRating: number | "";
  tracks: TrackRating[];
  createdAt: string;
  updatedAt: string;
};

export type AlbumFormValues = {
  artist: string;
  title: string;
  year: string;
  ratedTrackCount: string;
  officialTrackCount: string;
  favorite: boolean;
  status: ReviewStatus;
  gutRating: string;
  consistencyRating: string;
};

export type SortKey =
  | "overallRating"
  | "artist"
  | "year"
  | "favorite"
  | "status";
