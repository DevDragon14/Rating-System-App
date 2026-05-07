import { useRef, useState, type ChangeEvent } from "react";
import {
  exportAlbumsToCsv,
  importAlbumsFromCsv,
  importAlbumsFromXlsx,
} from "../data/albumCsv";
import type { Album } from "../types/album";

type ImportExportControlsProps = {
  albums: Album[];
  onImport: (albums: Album[]) => {
    importedCount: number;
    duplicateCount: number;
  };
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

  function chooseImportFile() {
    fileInputRef.current?.click();
  }

  function importSpreadsheet(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");
    const isXlsx = fileName.endsWith(".xlsx");

    if (!isCsv && !isXlsx) {
      setMessage("Please import a CSV or XLSX spreadsheet.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = isXlsx
        ? importAlbumsFromXlsx(reader.result as ArrayBuffer)
        : importAlbumsFromCsv(String(reader.result ?? ""));

      if (result.albums.length === 0) {
        setMessage(
          "No albums imported. Check that the spreadsheet has Artist and Album columns.",
        );
      } else {
        const importResult = onImport(result.albums);
        setMessage(
          `Imported ${importResult.importedCount} album${
            importResult.importedCount === 1 ? "" : "s"
          }. ${importResult.duplicateCount} duplicate${
            importResult.duplicateCount === 1 ? "" : "s"
          } ignored. ${result.skippedRows} row${
            result.skippedRows === 1 ? "" : "s"
          } skipped.`,
        );
      }

      event.target.value = "";
    };

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  return (
    <section className="import-export" aria-label="Import and export albums">
      <div>
        <p className="eyebrow">Spreadsheet tools</p>
        <h2>Import / Export</h2>
      </div>

      <div className="import-export-actions">
        <button type="button" onClick={chooseImportFile}>
          Import CSV/XLSX
        </button>
        <button type="button" onClick={exportCsv} disabled={albums.length === 0}>
          Export CSV
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="visually-hidden"
        onChange={importSpreadsheet}
      />

      <p className="helper-text">
        Import appends rows from CSV or the first worksheet in an XLSX file.
      </p>
      {message && <p className="field-note">{message}</p>}
    </section>
  );
}
