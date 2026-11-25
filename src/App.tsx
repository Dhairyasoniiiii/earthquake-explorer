import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ParticleEarth } from "./components/ParticleEarth";
import type { Earthquake } from "./types";

const FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
const REFRESH_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRY_MS = 10 * 60_000;

type FeedFeature = { id?: string; properties?: { place?: string; mag?: number | null; time?: number; title?: string }; geometry?: { coordinates?: unknown } };

function parseFeed(payload: unknown): Earthquake[] {
  if (!payload || typeof payload !== "object" || !("features" in payload)) return [];
  const features = (payload as { features?: unknown }).features;
  if (!Array.isArray(features)) return [];
  return features.flatMap((item): Earthquake[] => {
    if (!item || typeof item !== "object") return [];
    const feature = item as FeedFeature;
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates)) return [];
    const [lng, lat, depth] = coordinates;
    const properties = feature.properties;
    if (typeof feature.id !== "string" || !feature.id || !properties || typeof properties.time !== "number" || !Number.isFinite(properties.time)
      || typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90
      || typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) return [];
    return [{
      id: feature.id,
      place: typeof properties.place === "string" ? properties.place : typeof properties.title === "string" ? properties.title : "Unknown location",
      magnitude: typeof properties.mag === "number" && Number.isFinite(properties.mag) ? properties.mag : 0,
      depth: typeof depth === "number" && Number.isFinite(depth) ? depth : 0,
      lat,
      lng,
      time: properties.time,
    }];
  });
}

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [search, setSearch] = useState("");
  const [minimumMagnitude, setMinimumMagnitude] = useState(0);
  const [selected, setSelected] = useState<Earthquake | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let pending = false;
    let retryTimer = 0;
    let retryDelay = REFRESH_MS;
    const load = async () => {
      if (pending) return;
      pending = true;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(FEED_URL, { signal: controller.signal, cache: "no-cache" });
        if (!response.ok) throw new Error("USGS feed unavailable");
        const rows = parseFeed(await response.json());
        if (!rows.length) throw new Error("USGS feed returned no valid earthquake records");
        if (!active) return;
        setEarthquakes(rows);
        setUpdatedAt(Date.now());
        setError(false);
        retryDelay = REFRESH_MS;
      } catch (cause) {
        if (active) {
          setError(true);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
        }
      } finally {
        window.clearTimeout(timeout);
        pending = false;
        if (active) {
          setLoading(false);
          retryTimer = window.setTimeout(() => void load(), retryDelay);
        }
      }
    };
    void load();
    return () => { active = false; window.clearTimeout(retryTimer); };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return earthquakes.filter((event) => event.magnitude >= minimumMagnitude && event.place.toLowerCase().includes(query));
  }, [earthquakes, minimumMagnitude, search]);
  const strongest = useMemo(() => filtered.reduce((max, event) => Math.max(max, event.magnitude), 0), [filtered]);
  const average = useMemo(() => filtered.length ? filtered.reduce((sum, event) => sum + event.magnitude, 0) / filtered.length : 0, [filtered]);

  const openEvent = useCallback((id: string) => {
    setSelected(filtered.find((event) => event.id === id) ?? null);
  }, [filtered]);
  useEffect(() => {
    if (selected && !filtered.some((event) => event.id === selected.id)) setSelected(null);
  }, [filtered, selected]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return <main className="earth-app">
    <div className="space-backdrop" aria-hidden="true"><span className="nebula nebula-a"/><span className="nebula nebula-b"/><span className="space-grain"/></div>
    <header className="earth-header">
      <a className="wordmark" href="#home" aria-label="Seismic home"><span className="wordmark-icon">◉</span><span>SEISMIC<span className="wordmark-light"> / EARTH</span></span></a>
      <div className="header-live"><i className={`live-indicator${error ? " feed-error" : ""}`}/>{error ? <>DEGRADED <span>·</span> RETRYING</> : updatedAt ? <>LIVE <span>·</span> USGS</> : loading ? "CONNECTING TO USGS" : "FEED OFFLINE"}</div>
    </header>

    <section className="earth-stage" id="home" aria-label="Interactive earthquake globe">
      <div className="stage-copy"><span className="eyebrow">A LIVING PLANET</span><h1>Listen to the<br/><em>moving Earth.</em></h1><p>Real-time seismic activity, mapped across the globe.</p></div>
      <div className="earth-halo" aria-hidden="true"/><ParticleEarth events={filtered} onSelect={openEvent}/>
      <div className="stage-caption"><span className="caption-mark"/>{loading ? "Gathering seismic signals" : `${filtered.length.toLocaleString()} earthquakes · past 30 days`}</div>
      <div className="stage-coordinates" aria-hidden="true">36° 12′ N<br/>117° 32′ W</div>
    </section>

    <footer className="earth-console glass-console">
      <div className="console-intro"><span className="eyebrow">LIVE SEISMIC FIELD</span><strong>Earth, in motion</strong><small>{error ? "USGS unavailable · retrying" : updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : "Connecting to USGS"}</small></div>
      <label className="place-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a place" aria-label="Search earthquake place"/><kbd>↵</kbd></label>
      <label className="magnitude-filter"><span>MAGNITUDE <b>{minimumMagnitude.toFixed(1)}+</b></span><input type="range" min="0" max="8" step="0.1" value={minimumMagnitude} onChange={(event) => setMinimumMagnitude(Number(event.target.value))}/></label>
      <div className="console-stat"><span>EVENTS</span><strong>{filtered.length.toLocaleString()}</strong></div>
      <div className="console-stat"><span>STRONGEST</span><strong>{strongest.toFixed(1)}<i> M</i></strong></div>
      <div className="console-stat"><span>AVERAGE</span><strong>{average.toFixed(1)}<i> M</i></strong></div>
    </footer>

    {selected && <div className="event-detail glass-console" role="status" aria-live="polite"><button className="detail-close" onClick={() => setSelected(null)} aria-label="Close event details">×</button><span className="eyebrow">SEISMIC EVENT · {new Date(selected.time).toLocaleString()}</span><strong className="detail-magnitude">M{selected.magnitude.toFixed(1)}</strong><b>{selected.place}</b><span>Depth {selected.depth.toFixed(1)} km <i>·</i> {selected.lat.toFixed(2)}°, {selected.lng.toFixed(2)}°</span></div>}
  </main>;
};

export default App;

