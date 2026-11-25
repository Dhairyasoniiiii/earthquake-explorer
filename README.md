# Earthquake Explorer

A React and TypeScript app that turns recent USGS earthquake activity into an interactive particle globe. Drag to orbit, scroll to zoom, use the arrow keys to rotate, and select a visible event for its details.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`, or preview it with `npm run preview`.

## Loading and animation

A short 01–10% particle loading sequence plays while the particles gather into the globe. The introduction is independent of feed latency, so a slow USGS response does not block the globe. The canvas uses a capped pixel ratio and a 60 fps render target; animation pauses in hidden tabs and respects reduced-motion settings.

## Data

The app reads the USGS GeoJSON `all_month` feed, which covers the past 30 days. It refreshes once a minute after a successful request. Failed or stalled requests are retried with exponential backoff, up to ten minutes. Previously loaded events remain visible while the feed is temporarily unavailable.

## Main files

- `src/App.tsx` loads and validates the feed, filters events, and renders summary statistics.
- `src/components/ParticleEarth.tsx` draws the globe and earthquake markers on a canvas.
- `src/types.ts` defines the earthquake event shape.
- `src/index.css` contains the layout, responsive rules, and visual styling.

