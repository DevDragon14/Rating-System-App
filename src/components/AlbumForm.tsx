import { useEffect, useState, type FormEvent } from "react";
import type { Album, AlbumFormValues, ReviewStatus, TrackRating } from "../types/album";
import {
  calculateOverallRating,
  calculateSongRating,
  isValidRating,
  ratingToPercentage,
} from "../utils/scoring";

type AlbumFormProps = {
  album?: Album;
  onCancelEdit: () => void;
  onSave: (album: Album) => void;
};

type TrackFormValues = Omit<TrackRating, "rating"> & {
  rating: string;
};

type ScorePreview = {
  songRating: number | "";
  overallRating: number | "";
  hasInvalidRating: boolean;
};

const blankForm: AlbumFormValues = {
  artist: "",
  title: "",
  year: "",
  ratedTrackCount: "",
  officialTrackCount: "",
  favorite: false,
  status: "Planned",
  gutRating: "",
  consistencyRating: "",
};

export function AlbumForm({ album, onCancelEdit, onSave }: AlbumFormProps) {
  const [formValues, setFormValues] = useState<AlbumFormValues>(blankForm);
  const [tracks, setTracks] = useState<TrackFormValues[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const savedSongRating = album?.songRating ?? "";
  const canMarkReviewed = isReviewComplete(formValues, tracks, savedSongRating);
  const scorePreview = getScorePreview(formValues, tracks, savedSongRating);

  useEffect(() => {
    if (!album) {
      setFormValues(blankForm);
      setTracks([]);
      return;
    }

    setFormValues({
      artist: album.artist,
      title: album.title,
      year: String(album.year),
      ratedTrackCount: String(album.ratedTrackCount),
      officialTrackCount: String(album.officialTrackCount),
      favorite: album.favorite,
      status: album.status,
      gutRating: String(album.gutRating),
      consistencyRating: String(album.consistencyRating),
    });
    setTracks(
      album.tracks.map((track) => ({
        ...track,
        rating: track.rating === "" ? "" : String(track.rating),
      })),
    );
  }, [album]);

  function updateField(field: keyof AlbumFormValues, value: string | boolean) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function updateTrack(trackId: string, updates: Partial<TrackFormValues>) {
    setTracks((currentTracks) =>
      currentTracks.map((track) =>
        track.id === trackId ? { ...track, ...updates } : track,
      ),
    );
  }

  function addTrack() {
    setTracks((currentTracks) => [
      ...currentTracks,
      {
        id: createId(),
        trackNumber: currentTracks.length + 1,
        title: "",
        rating: "",
        skipped: false,
      },
    ]);
  }

  function removeTrack(trackId: string) {
    setTracks((currentTracks) =>
      currentTracks.filter((track) => track.id !== trackId),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!formValues.artist.trim() || !formValues.title.trim()) {
      setErrorMessage("Artist and album title are required.");
      return;
    }

    const gutRating = parseOptionalRating(formValues.gutRating);
    const consistencyRating = parseOptionalRating(formValues.consistencyRating);

    if (gutRating === null || consistencyRating === null) {
      setErrorMessage("Ratings must be between 1 and 11 in 0.25 steps.");
      return;
    }

    const parsedTracks = tracks.map((track) => {
      const rating = track.skipped ? "" : parseOptionalRating(track.rating);

      return {
        ...track,
        title: track.title.trim(),
        rating,
      };
    });

    if (parsedTracks.some((track) => track.rating === null)) {
      setErrorMessage("Track ratings must be between 1 and 11 in 0.25 steps.");
      return;
    }

    const cleanedTracks = parsedTracks as TrackRating[];

    if (
      formValues.status === "Reviewed" &&
      (gutRating === "" ||
        consistencyRating === "" ||
        (!cleanedTracks.some((track) => !track.skipped && typeof track.rating === "number") &&
          savedSongRating === ""))
    ) {
      setErrorMessage(
        "Reviewed albums need Gut, Consistency, and either a Song Rating or at least one rated track.",
      );
      return;
    }

    const now = new Date().toISOString();

    onSave({
      id: album?.id ?? createId(),
      artist: formValues.artist.trim(),
      title: formValues.title.trim(),
      year: parseOptionalWholeNumber(formValues.year),
      ratedTrackCount: parseOptionalWholeNumber(formValues.ratedTrackCount),
      officialTrackCount: parseOptionalWholeNumber(formValues.officialTrackCount),
      favorite: formValues.favorite,
      status: formValues.status,
      gutRating,
      songRating: album?.songRating ?? "",
      consistencyRating,
      overallRating: album?.overallRating ?? "",
      tracks: cleanedTracks,
      createdAt: album?.createdAt ?? now,
      updatedAt: now,
    });

    setFormValues(blankForm);
    setTracks([]);
  }

  return (
    <form className="album-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{album ? "Editing" : "New album"}</p>
          <h2>{album ? `${album.artist} - ${album.title}` : "Add album"}</h2>
        </div>
        {album && (
          <button type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="field-grid">
        <label>
          Artist
          <input
            value={formValues.artist}
            onChange={(event) => updateField("artist", event.target.value)}
            placeholder="Nas"
          />
        </label>

        <label>
          Album title
          <input
            value={formValues.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Illmatic"
          />
        </label>

        <label>
          Year
          <input
            inputMode="numeric"
            value={formValues.year}
            onChange={(event) => updateField("year", event.target.value)}
            placeholder="1994"
          />
        </label>

        <label>
          Tracks rated
          <input
            inputMode="numeric"
            value={formValues.ratedTrackCount}
            onChange={(event) => updateField("ratedTrackCount", event.target.value)}
            placeholder="10"
          />
        </label>

        <label>
          Official tracks
          <input
            inputMode="numeric"
            value={formValues.officialTrackCount}
            onChange={(event) => updateField("officialTrackCount", event.target.value)}
            placeholder="10"
          />
        </label>

        <label>
          Review status
          <select
            value={formValues.status}
            onChange={(event) =>
              updateField("status", event.target.value as ReviewStatus)
            }
          >
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Reviewed" disabled={!canMarkReviewed}>
              Reviewed
            </option>
          </select>
          {!canMarkReviewed && (
            <span className="field-note">
              Add Gut, Consistency, and a Song Rating or rated track to mark reviewed.
            </span>
          )}
        </label>

        <label>
          Gut rating
          <input
            inputMode="decimal"
            value={formValues.gutRating}
            onChange={(event) => updateField("gutRating", event.target.value)}
            placeholder="8.75"
          />
        </label>

        <label>
          Consistency rating
          <input
            inputMode="decimal"
            value={formValues.consistencyRating}
            onChange={(event) =>
              updateField("consistencyRating", event.target.value)
            }
            placeholder="9"
          />
        </label>
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={formValues.favorite}
          onChange={(event) => updateField("favorite", event.target.checked)}
        />
        Favorite for vinyl list
      </label>

      <section className="score-preview" aria-label="Live score preview">
        <div>
          <span>Song</span>
          <strong>{formatRating(scorePreview.songRating)}</strong>
        </div>
        <div>
          <span>Overall</span>
          <strong>{formatRating(scorePreview.overallRating)}</strong>
        </div>
        <div>
          <span>Overall %</span>
          <strong>{formatPercentage(scorePreview.overallRating)}</strong>
        </div>
      </section>

      {scorePreview.hasInvalidRating && (
        <p className="field-note">
          Preview updates after ratings use the 1 to 11 scale in 0.25 steps.
        </p>
      )}

      <section className="track-editor">
        <div className="section-heading">
          <h3>Track ratings</h3>
          <button type="button" onClick={addTrack}>
            Add track
          </button>
        </div>

        {tracks.length === 0 ? (
          <p className="helper-text">
            Add tracks when you are ready. Skits and instrumentals can be marked skipped.
          </p>
        ) : (
          <div className="track-list">
            {tracks.map((track) => (
              <div className="track-row" key={track.id}>
                <input
                  className="track-number"
                  inputMode="numeric"
                  value={track.trackNumber}
                  onChange={(event) =>
                    updateTrack(track.id, {
                      trackNumber: Number(event.target.value) || track.trackNumber,
                    })
                  }
                  aria-label="Track number"
                />
                <input
                  value={track.title}
                  onChange={(event) =>
                    updateTrack(track.id, { title: event.target.value })
                  }
                  placeholder="Track title"
                  aria-label="Track title"
                />
                <input
                  className="track-rating"
                  inputMode="decimal"
                  value={track.rating}
                  disabled={track.skipped}
                  onChange={(event) =>
                    updateTrack(track.id, {
                      rating: event.target.value,
                    })
                  }
                  placeholder="8.5"
                  aria-label="Track rating"
                />
                <label className="skip-check">
                  <input
                    type="checkbox"
                    checked={track.skipped}
                    onChange={(event) =>
                      updateTrack(track.id, { skipped: event.target.checked })
                    }
                  />
                  Skip
                </label>
                <button type="button" onClick={() => removeTrack(track.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="primary-action" type="submit">
        {album ? "Save changes" : "Add album"}
      </button>
    </form>
  );
}

function parseOptionalRating(value: string): number | "" | null {
  if (value.trim() === "") {
    return "";
  }

  const rating = Number(value);
  return isValidRating(rating) ? rating : null;
}

function parseOptionalWholeNumber(value: string): number | "" {
  if (value.trim() === "") {
    return "";
  }

  const parsedNumber = Number(value);

  if (!Number.isFinite(parsedNumber)) {
    return "";
  }

  return Math.max(0, Math.floor(parsedNumber));
}

function isReviewComplete(
  formValues: AlbumFormValues,
  tracks: TrackFormValues[],
  savedSongRating: number | "",
): boolean {
  const gutRating = parseOptionalRating(formValues.gutRating);
  const consistencyRating = parseOptionalRating(formValues.consistencyRating);
  const hasRatedTrack = tracks.some((track) => {
    const rating = parseOptionalRating(track.rating);
    return !track.skipped && typeof rating === "number";
  });
  const hasSongRating = hasRatedTrack || savedSongRating !== "";

  return (
    typeof gutRating === "number" &&
    typeof consistencyRating === "number" &&
    hasSongRating
  );
}

function getScorePreview(
  formValues: AlbumFormValues,
  tracks: TrackFormValues[],
  savedSongRating: number | "",
): ScorePreview {
  const gutRating = parseOptionalRating(formValues.gutRating);
  const consistencyRating = parseOptionalRating(formValues.consistencyRating);
  const parsedTracks = tracks.map((track) => ({
    ...track,
    rating: track.skipped ? "" : parseOptionalRating(track.rating),
  }));

  if (
    gutRating === null ||
    consistencyRating === null ||
    parsedTracks.some((track) => track.rating === null)
  ) {
    return {
      songRating: "",
      overallRating: "",
      hasInvalidRating: true,
    };
  }

  const calculatedSongRating = calculateSongRating(parsedTracks as TrackRating[]);
  const songRating =
    calculatedSongRating === "" ? savedSongRating : calculatedSongRating;
  const overallRating = calculateOverallRating({
    gutRating,
    songRating,
    consistencyRating,
  });

  return {
    songRating,
    overallRating,
    hasInvalidRating: false,
  };
}

function formatRating(value: number | ""): string {
  return value === "" ? "-" : value.toFixed(2);
}

function formatPercentage(value: number | ""): string {
  const percentage = ratingToPercentage(value);
  return percentage === "" ? "-" : `${percentage.toFixed(2)}%`;
}

function createId(): string {
  return window.crypto?.randomUUID?.() ?? String(Date.now());
}
