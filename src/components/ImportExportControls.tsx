import { useRef, useState, type ChangeEvent } from "react";
import { exportAlbumsToCsv, importAlbumsFromCsv } from "../data/albumCsv";
import type { Album } from "../types/album";

type ImportExportControlsProps = {
  albums: Album[];
  onImport: (albums: Album[]) => void;
};

export function ImportExportControls({
  albums,
  onImport,
}: ImportExportControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");

  function exportCsv() {
    const csvText = exportAlbumsToCsv(albums);
    const csvBlob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const csvUrl = window.URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = csvUrl;
    downloadLink.download = "hip-hop-album-rankings.csv";
    downloadLink.click();
    window.URL.revokeObjectURL(csvUrl);
    setMessage(`Exported ${albums.length} album${albums.length === 1 ? "" : "s"}.`);
  }

  function chooseCsvFile() {
    fileInputRef.current?.click();
  }

  function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please save the spreadsheet as CSV before importing.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = importAlbumsFromCsv(String(reader.result ?? ""));

      if (result.albums.length === 0) {
        setMessage("No albums imported. Check that the CSV has Artist and Album columns.");
      } else {
        onImport(result.albums);
        setMessage(
          `Imported ${result.albums.length} album${
            result.albums.length === 1 ? "" : "s"
          }. ${result.skippedRows} row${result.skippedRows === 1 ? "" : "s"} skipped.`,
        );
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  }

  return (
    <section className="import-export" aria-label="Import and export albums">
      <div>
        <p className="eyebrow">Spreadsheet tools</p>
        <h2>Import / Export</h2>
      </div>

      <div className="import-export-actions">
        <button type="button" onClick={chooseCsvFile}>
          Import CSV
        </button>
        <button type="button" onClick={exportCsv} disabled={albums.length === 0}>
          Export CSV
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="visually-hidden"
        onChange={importCsv}
      />

      <p className="helper-text">
        Import appends rows. XLSX files should be saved as CSV first.
      </p>
      {message && <p className="field-note">{message}</p>}
    </section>
  );
}
