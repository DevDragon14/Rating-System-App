# Hip-Hop Album Ranker

A beginner-friendly, local-first app for reviewing and ranking hip-hop albums.

## What We Are Building

This app turns a manual album-review spreadsheet into a small web app. The MVP lets a reviewer add albums, rate tracks, calculate album scores, and see albums ranked.

## Why This Shape

- React keeps the UI organized into small pieces.
- Vite keeps local development simple and fast.
- Local storage saves albums in the browser without accounts, servers, or cloud sync.
- The scoring rules stay close to the reviewer's existing spreadsheet system.

## Current Scoring Rules

- Track ratings use a 1 to 11 scale.
- Track ratings can use 0.25 increments, like 7.25, 8.5, or 9.75.
- Skipped tracks do not count toward the song rating.
- Song Rating is the average of rated tracks only.
- Overall Rating is the equal-weight average of Gut Rating, Song Rating, and Consistency Rating.
- Scores are displayed as percentages with 2 decimal places to match the spreadsheet.
- Percentages use 10 as the perfect-score baseline, so 8.5 displays as 85.00% and 11 displays as 110.00%.
- Favorite is only for display and vinyl-buying guidance. It does not affect ranking.

## Import And Export

- CSV export downloads the current local album library.
- CSV and XLSX import append albums to the current local library.
- XLSX import reads the first worksheet.
- Import ignores duplicate albums with the same artist, title, and year.
- Import expects at least Artist and Album/Album Title columns.
- Clear Library removes this browser's saved albums after confirmation.

## Where The Code Lives

- `src/types/album.ts` defines the album and track data shapes.
- `src/utils/scoring.ts` calculates song and overall ratings.
- `src/data/albumStorage.ts` loads and saves albums in local storage.
- `src/components/AlbumForm.tsx` handles adding and editing albums.
- `src/components/AlbumTable.tsx` displays the album table.
- `src/components/SearchAndSort.tsx` handles search and sorting controls.
- `src/App.tsx` connects the screens, data, and actions.

## When To Add Bigger Features

Add spreadsheet import/export after the basic add, edit, delete, ranking, and queue flows feel solid. Add dashboards after there is enough real album data to make the stats useful.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```
