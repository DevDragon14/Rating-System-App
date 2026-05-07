import type { Album, ReviewStatus } from "../types/album";
import {
  calculateOverallRating,
  ratingToPercentage,
} from "../utils/scoring";

type CsvImportResult = {
  albums: Album[];
  skippedRows: number;
};

const EXPORT_HEADERS = [
  "Artist",
  "Album Title",
  "Year",
  "Tracks Rated",
  "Official Tracks",
  "Favorite",
  "Review Status",
  "Gut Rating",
  "Song Rating",
  "Consistency Rating",
  "Overall Rating",
  "Overall Percentage",
  "Created At",
  "Updated At",
];

export function exportAlbumsToCsv(albums: Album[]): string {
  const rows = albums.map((album) => [
    album.artist,
    album.title,
    album.year,
    album.ratedTrackCount,
    album.officialTrackCount,
    album.favorite ? "Yes" : "No",
    album.status,
    album.gutRating,
    album.songRating,
    album.consistencyRating,
    album.overallRating,
    formatCsvNumber(ratingToPercentage(album.overallRating)),
    album.createdAt,
    album.updatedAt,
  ]);

  return [EXPORT_HEADERS, ...rows]
    .map((row) => row.map(formatCsvCell).join(","))
    .join("\n");
}

export function importAlbumsFromCsv(csvText: string): CsvImportResult {
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    return { albums: [], skippedRows: 0 };
  }

  const headers = rows[0].map(normalizeHeader);
  let skippedRows = 0;
  const albums = rows.slice(1).flatMap((row) => {
    const album = albumFromRow(headers, row);

    if (!album) {
      skippedRows += 1;
      return [];
    }

    return [album];
  });

  return { albums, skippedRows };
}

function albumFromRow(headers: string[], row: string[]): Album | null {
  const artist = getField(headers, row, ["artist"]).trim();
  const title = getField(headers, row, ["albumtitle", "album", "title"]).trim();

  if (!artist || !title) {
    return null;
  }

  const now = new Date().toISOString();
  const trackCounts = parseTrackCounts(
    getField(headers, row, ["trackcount", "tracks", "tracksrated", "oftracks"]),
  );
  const ratedTrackCount =
    parseOptionalWholeNumber(getField(headers, row, ["tracksrated", "ratedtracks"])) ||
    trackCounts.ratedTrackCount;
  const officialTrackCount =
    parseOptionalWholeNumber(getField(headers, row, ["officialtracks"])) ||
    trackCounts.officialTrackCount;
  const gutRating = parseOptionalRating(getField(headers, row, ["gutrating", "gut"]));
  const songRating = parseOptionalScore(
    getField(headers, row, ["songrating", "song"]),
  );
  const consistencyRating = parseOptionalRating(
    getField(headers, row, ["consistencyrating", "consistency"]),
  );
  const calculatedOverall = calculateOverallRating({
    gutRating,
    songRating,
    consistencyRating,
  });
  const importedOverall = parseOptionalScore(
    getField(headers, row, ["overallrating", "overall"]),
  );
  const overallRating = importedOverall || calculatedOverall;

  return {
    id: createId(),
    artist,
    title,
    year: parseOptionalWholeNumber(getField(headers, row, ["year"])),
    ratedTrackCount,
    officialTrackCount,
    favorite: parseBoolean(
      getField(headers, row, ["favorite", "favourite", "favoritex"]),
    ),
    status: parseStatus(getField(headers, row, ["reviewstatus", "status"]), {
      gutRating,
      songRating,
      consistencyRating,
      overallRating,
    }),
    gutRating,
    songRating,
    consistencyRating,
    overallRating,
    tracks: [],
    createdAt: now,
    updatedAt: now,
  };
}

function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === "\"" && nextCharacter === "\"") {
      currentCell += "\"";
      index += 1;
      continue;
    }

    if (character === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function getField(headers: string[], row: string[], names: string[]): string {
  const index = headers.findIndex((header) => names.includes(header));
  return index === -1 ? "" : row[index] ?? "";
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseTrackCounts(value: string): {
  ratedTrackCount: number | "";
  officialTrackCount: number | "";
} {
  const match = value.match(/(\d+)\s*(?:\((\d+)\))?/);

  return {
    ratedTrackCount: match ? Number(match[1]) : "",
    officialTrackCount: match?.[2] ? Number(match[2]) : "",
  };
}

function parseOptionalRating(value: string): number | "" {
  return parseOptionalScore(value);
}

function parseOptionalScore(value: string): number | "" {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return "";
  }

  const percentageMatch = trimmedValue.match(/(\d+(?:\.\d+)?)\s*%/);

  if (percentageMatch) {
    const percentageValue = Number(percentageMatch[1]);
    const ratingValue = percentageValue / 10;

    return Number.isFinite(ratingValue) && ratingValue >= 1 && ratingValue <= 11
      ? ratingValue
      : "";
  }

  const fractionMatch = trimmedValue.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);

  if (fractionMatch) {
    const ratingValue = Number(fractionMatch[1]);

    return Number.isFinite(ratingValue) && ratingValue >= 1 && ratingValue <= 11
      ? ratingValue
      : "";
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) && parsedValue >= 1 && parsedValue <= 11
    ? parsedValue
    : "";
}

function parseOptionalWholeNumber(value: string): number | "" {
  if (value.trim() === "") {
    return "";
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.max(0, Math.floor(parsedValue)) : "";
}

function parseBoolean(value: string): boolean {
  return ["true", "yes", "y", "1", "favorite", "x"].includes(
    value.trim().toLowerCase(),
  );
}

function parseStatus(
  value: string,
  ratings: Pick<
    Album,
    "gutRating" | "songRating" | "consistencyRating" | "overallRating"
  >,
): ReviewStatus {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "reviewed") {
    return "Reviewed";
  }

  if (normalizedValue === "in progress" || normalizedValue === "inprogress") {
    return "In Progress";
  }

  if (
    ratings.gutRating !== "" &&
    ratings.songRating !== "" &&
    ratings.consistencyRating !== "" &&
    ratings.overallRating !== ""
  ) {
    return "Reviewed";
  }

  return "Planned";
}

function formatCsvCell(value: string | number | boolean): string {
  const text = String(value);

  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}

function formatCsvNumber(value: number | ""): string {
  return value === "" ? "" : value.toFixed(2);
}

function createId(): string {
  return window.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
}
