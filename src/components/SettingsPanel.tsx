import { STORAGE_KEY } from "../data/albumStorage";
import type { Album } from "../types/album";

type SettingsPanelProps = {
  albums: Album[];
};

export function SettingsPanel({ albums }: SettingsPanelProps) {
  const storageSize = new Blob([JSON.stringify(albums)]).size;

  return (
    <section className="settings-area">
      <div className="section-heading">
        <div>
          <p className="eyebrow">App Settings</p>
          <h2>Local storage</h2>
        </div>
      </div>

      <div className="settings-grid">
        <InfoCard label="Storage type" value="Browser localStorage" />
        <InfoCard label="Saved albums" value={String(albums.length)} />
        <InfoCard label="Storage key" value={STORAGE_KEY} />
        <InfoCard label="Current site" value={window.location.origin} />
        <InfoCard label="App path" value={window.location.pathname} />
        <InfoCard label="Approx storage used" value={formatBytes(storageSize)} />
      </div>

      <p className="helper-text">
        This data is saved inside this browser profile for this exact website.
        It is not a normal project file and it is not shared across different
        browsers, phones, or computers.
      </p>

      <p className="helper-text">
        For now, CSV export is the backup path. A database can come later when
        we want multi-device sync, accounts, or shared access.
      </p>
    </section>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
};

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="settings-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}
