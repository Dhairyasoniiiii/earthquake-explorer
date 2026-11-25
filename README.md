# Earthquake Explorer

A lightweight React and TypeScript app that displays recent USGS earthquake activity on an animated particle globe. Search by place, filter by minimum magnitude, and select a visible event to inspect its details.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`, or preview it with `npm run preview`.

## Data

The app reads the USGS GeoJSON `all_month` feed, which covers the past 30 days. It refreshes once a minute after a successful request. Failed or stalled requests are retried with exponential backoff, up to ten minutes. Previously loaded events remain visible while the feed is temporarily unavailable.

## Main files

- `src/App.tsx` loads and validates the feed, filters events, and renders summary statistics.
- `src/components/ParticleEarth.tsx` draws the globe and event markers on a canvas.
- `src/types.ts` defines the earthquake event shape.
- `src/index.css` contains the layout, responsive rules, and visual styling.

