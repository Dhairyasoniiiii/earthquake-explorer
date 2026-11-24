import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ParticleEarth } from "./components/ParticleEarth";
import type { Earthquake } from "./types";

const FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
const REFRESH_MS = 60_000;

type FeedFeature = { id: string; properties?: { place?: string; mag?: number; time?: number; title?: string }; geometry?: { coordinates?: number[] } };

function parseFeed(payload: unknown): Earthquake[] {
  const features = (payload as { features?: FeedFeature[] })?.features ?? [];
  return features.flatMap((feature) => {
    const [lng, lat, depth] = feature.geometry?.coordinates ?? [];
    const properties = feature.properties;
    if (!feature.id || !properties || !Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(properties.time)) return [];
    return [{
      id: feature.id,
      place: properties.place || properties.title || "Unknown location",
      magnitude: Number.isFinite(properties.mag) ? properties.mag as number : 0,
      depth: Number.isFinite(depth) ? depth as number : 0,
      lat: lat as number,
      lng: lng as number,
      time: properties.time as number,
    }];
  });
}

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [search, setSearch] = useState("");
  const [minimumMagnitude, setMinimumMagnitude] = useState(0);
  const [selected, setSelected] = useState<Earthquake | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(FEED_URL, { signal: controller.signal, cache: "no-cache" });
        if (!response.ok) throw new Error("USGS feed unavailable");
        const rows = parseFeed(await response.json());
        if (!active) return;
        setEarthquakes(rows);
        setUpdatedAt(Date.now());
        setError(false);
      } catch (cause) {
        if (active && !(cause instanceof DOMException && cause.name === "AbortError")) setError(true);
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return earthquakes.filter((event) => event.magnitude >= minimumMagnitude && event.place.toLocaleLowerCase().includes(query));
  }, [earthquakes, minimumMagnitude, search]);
  const strongest = useMemo(() => filtered.reduce((max, event) => Math.max(max, event.magnitude), 0), [filtered]);
  const average = useMemo(() => filtered.length ? filtered.reduce((sum, event) => sum + event.magnitude, 0) / filtered.length : 0, [filtered]);

  const openEvent = useCallback((id: string) => {
    setSelected(filtered.find((event) => event.id === id) ?? null);
  }, [filtered]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return <main className="earth-app">
    <div className="space-backdrop" aria-hidden="true"><span className="nebula nebula-a"/><span className="nebula nebula-b"/><span className="space-grain"/></div>
    <header className="earth-header">
      <a className="wordmark" href="#home" aria-label="Seismic home"><span className="wordmark-icon">◉</span><span>SEISMIC<span className="wordmark-light"> / EARTH</span></span></a>
      <div className="header-live"><i className="live-indicator"/>{updatedAt ? <>LIVE <span>·</span> {new Date(now).toLocaleTimeString()}</> : loading ? "CONNECTING TO USGS" : "FEED OFFLINE"}</div>
    </header>

    <section className="earth-stage" id="home" aria-label="Interactive earthquake globe">
      <div className="stage-copy"><span className="eyebrow">A LIVING PLANET</span><h1>Listen to the<br/><em>moving Earth.</em></h1><p>Real-time seismic activity, mapped across the globe.</p></div>
      <div className="earth-halo" aria-hidden="true"/><ParticleEarth events={filtered} onSelect={openEvent}/>
      <div className="stage-caption"><span className="caption-mark"/>{loading ? "Gathering seismic signals" : `${filtered.length.toLocaleString()} earthquakes · past 30 days`}</div>
      <div className="stage-coordinates" aria-hidden="true">36° 12′ N<br/>117° 32′ W</div>
    </section>

    <footer className="earth-console glass-console">
      <div className="console-intro"><span className="eyebrow">LIVE SEISMIC FIELD</span><strong>Earth, in motion</strong><small>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : error ? "Retrying USGS connection" : "Connecting to USGS"}</small></div>
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
