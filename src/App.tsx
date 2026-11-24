import React, { useEffect, useMemo, useState } from "react";
import DataTable from "./components/DataTable";
import { ChartPanel } from "./components/ChartPanel";
import { GlobePanel, type GlobePoint } from "./components/GlobePanel";
import type { Earthquake } from "./types";

const FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv";
const REFRESH_MS = 60_000;
const MAX_GLOBE_POINTS = 500;
type Field = "magnitude" | "depth" | "nst" | "gap";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += char;
  }
  values.push(value.trim());
  return values;
}

function parseUSGSCsv(csv: string): Earthquake[] {
  const [header, ...rows] = csv.split(/\r?\n/).filter((line) => line.trim());
  if (!header || rows.length === 0) return [];
  const indexes = new Map(parseCsvLine(header).map((name, index) => [name, index]));
  const field = (columns: string[], name: string) => {
    const index = indexes.get(name);
    return index === undefined ? undefined : columns[index];
  };
  const number = (value: string | undefined) => {
    if (value == null || value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return rows.flatMap((line) => {
    const columns = parseCsvLine(line);
    const id = field(columns, "id");
    const lat = number(field(columns, "latitude"));
    const lng = number(field(columns, "longitude"));
    const time = Date.parse(field(columns, "time") ?? "");
    if (!id || lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !Number.isFinite(time)) return [];
    const optional = (key: string) => number(field(columns, key));
    return [{
      id,
      place: field(columns, "place") || "Unknown location",
      magnitude: number(field(columns, "mag")) ?? 0,
      depth: number(field(columns, "depth")) ?? 0,
      lat,
      lng,
      time,
      magType: field(columns, "magType") || undefined,
      type: field(columns, "type") || undefined,
      nst: optional("nst"),
      gap: optional("gap"),
      dmin: optional("dmin"),
      rms: optional("rms"),
      horizontalError: optional("horizontalError"),
      depthError: optional("depthError"),
      magError: optional("magError"),
      magNst: optional("magNst"),
    }];
  });
}

const fieldLabels: Record<Field, string> = {
  magnitude: "Magnitude",
  depth: "Depth",
  nst: "Stations",
  gap: "Azimuthal gap",
};

const getValue = (eq: Earthquake, field: Field) => {
  if (field === "nst") return eq.nst ?? 0;
  if (field === "gap") return eq.gap ?? 0;
  return eq[field];
};

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [minimumMagnitude, setMinimumMagnitude] = useState(0);
  const [heightField, setHeightField] = useState<Field>("magnitude");
  const [colorField, setColorField] = useState<Field>("magnitude");
  const [globeOpen, setGlobeOpen] = useState(false);
  const [eventToastOpen, setEventToastOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let pending = false;
    const load = async (initial = false) => {
      if (pending) return;
      pending = true;
      if (initial) setLoading(true);
      try {
        const response = await fetch(FEED_URL, { signal: controller.signal, cache: "no-cache" });
        if (!response.ok) throw new Error(`USGS returned ${response.status}`);
        const rows = parseUSGSCsv(await response.text());
        if (!rows.length) throw new Error("The USGS feed returned no valid earthquake records.");
        if (!active) return;
        setEarthquakes(rows);
        setUpdatedAt(Date.now());
        setError(null);
      } catch (cause) {
        if (!active || (cause instanceof DOMException && cause.name === "AbortError")) return;
        setError(cause instanceof Error ? cause.message : "Unable to load earthquake data.");
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void load(true);
    const interval = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(
    () => earthquakes.filter((eq) => eq.magnitude >= minimumMagnitude),
    [earthquakes, minimumMagnitude],
  );
  const selected = filtered.find((eq) => eq.id === selectedId) ?? null;
  const stats = useMemo(() => ({
    count: filtered.length,
    strongest: filtered.reduce((max, eq) => Math.max(max, eq.magnitude), 0),
    average: filtered.length ? filtered.reduce((sum, eq) => sum + eq.magnitude, 0) / filtered.length : 0,
  }), [filtered]);
  const points = useMemo<GlobePoint[]>(() => {
    const mapEvents = filtered.length <= MAX_GLOBE_POINTS
      ? filtered
      : Array.from({ length: MAX_GLOBE_POINTS }, (_, index) =>
          filtered[Math.floor(index * (filtered.length - 1) / (MAX_GLOBE_POINTS - 1))]);
    const values = mapEvents.map((eq) => getValue(eq, colorField));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return mapEvents.map((eq) => {
      const ratio = max === min ? 0.5 : (getValue(eq, colorField) - min) / (max - min);
      const color = ratio > 0.75 ? "#ff765f" : ratio > 0.4 ? "#ffbd66" : "#66d9d0";
      return {
        id: eq.id,
        lat: eq.lat,
        lng: eq.lng,
        altitude: getValue(eq, heightField),
        color,
        label: `${eq.place} · M${eq.magnitude.toFixed(1)}`,
      };
    });
  }, [filtered, heightField, colorField]);
  const selectEvent = (event: Earthquake) => {
    setSelectedId(event.id);
    setEventToastOpen(true);
  };

  useEffect(() => {
    if (selectedId && !filtered.some((eq) => eq.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!globeOpen && !eventToastOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setGlobeOpen(false); setEventToastOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [globeOpen, eventToastOpen]);

  return (
    <main className="app-shell">
      <div className="seismic-atmosphere" aria-hidden="true"><span className="aurora-haze" /><span className="seismic-wave seismic-wave-one" /><span className="seismic-wave seismic-wave-two" /><span className="signal-sweep" /></div>
      {error && <div className="notice" role="status">{earthquakes.length ? `Refresh failed: ${error}. Showing the last successful update.` : `Could not load earthquake data: ${error}`}</div>}

      <section className="toolbar glass-panel" aria-label="View controls">
        <div className="feed-status"><span className="live-dot" />{updatedAt ? `Live · ${new Date(updatedAt).toLocaleTimeString()}` : loading ? "Loading feed" : "Waiting for data"}</div>
        <label className="filter-control"><span>Magnitude <b>{minimumMagnitude.toFixed(1)}+</b></span><input type="range" min="0" max="8" step="0.1" value={minimumMagnitude} onChange={(event) => setMinimumMagnitude(Number(event.target.value))} /></label>
        <label className="select-control"><span>Globe height</span><select value={heightField} onChange={(event) => setHeightField(event.target.value as Field)}>{Object.entries(fieldLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="select-control"><span>Point color</span><select value={colorField} onChange={(event) => setColorField(event.target.value as Field)}>{Object.entries(fieldLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </section>

      <section className="dashboard-grid">
        <div className="visual-column">
          <section className="panel glass-panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">PATTERNS</span><h2>Magnitude over time</h2></div><span className="panel-meta">{Math.min(filtered.length, 1_000).toLocaleString()} shown · {filtered.length.toLocaleString()} total</span></div><div className="chart-frame"><ChartPanel earthquakes={filtered} onSelect={selectEvent} /></div></section>
          <section className="panel glass-panel globe-panel"><div className="panel-heading"><div><span className="eyebrow">WORLD VIEW</span><h2>Epicenters</h2></div><span className="panel-meta">{points.length.toLocaleString()} of {filtered.length.toLocaleString()}</span><button className="quiet-button" onClick={() => setGlobeOpen(true)}>Expand globe <span aria-hidden="true">↗</span></button></div><div className="globe-frame"><GlobePanel pointsData={points} altitudeField="altitude" onPointClick={(point) => { const event = filtered.find((row) => row.id === point.id); if (event) selectEvent(event); }} height="100%" enableZoom={false} /></div></section>
        </div>

        <aside className="panel glass-panel events-panel"><div className="panel-heading"><div><span className="eyebrow">LIVE FEED</span><h2>Earthquakes</h2></div><span className="panel-meta">{filtered.length.toLocaleString()}</span></div><div className="table-frame">{loading && !earthquakes.length ? <div className="empty-state"><span className="loader" />Loading USGS data…</div> : filtered.length ? <DataTable earthquakes={filtered} selectedEarthquake={selected} onSelect={selectEvent} /> : <div className="empty-state">No events match this magnitude.</div>}</div><section className="stats-under-table" aria-label="Earthquake summary"><div className="stat-card glass-panel"><span>Events</span><strong>{stats.count.toLocaleString()}</strong></div><div className="stat-card glass-panel"><span>Strongest magnitude</span><strong>{stats.strongest.toFixed(1)} <i>M</i></strong></div><div className="stat-card glass-panel"><span>Average magnitude</span><strong>{stats.average.toFixed(1)} <i>M</i></strong></div></section></aside>
      </section>

      {globeOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setGlobeOpen(false); }}><section className="globe-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="globe-title"><div className="panel-heading"><div><span className="eyebrow">WORLD VIEW</span><h2 id="globe-title">Epicenters</h2></div><button className="quiet-button" autoFocus onClick={() => setGlobeOpen(false)} aria-label="Close globe">Close <span aria-hidden="true">×</span></button></div><div className="globe-frame"><GlobePanel pointsData={points} altitudeField="altitude" onPointClick={(point) => { const event = filtered.find((row) => row.id === point.id); if (event) selectEvent(event); setGlobeOpen(false); }} height="100%" enableZoom /></div></section></div>}
      {eventToastOpen && selected && <div className="event-toast-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEventToastOpen(false); }}><section className="event-toast glass-panel" role="dialog" aria-modal="true" aria-labelledby="event-toast-title"><div className="toast-orbit toast-orbit-one"/><div className="toast-orbit toast-orbit-two"/><button className="toast-close quiet-button" onClick={() => setEventToastOpen(false)} aria-label="Close event details">Close <span aria-hidden="true">×</span></button><div className="toast-content"><span className="eyebrow">SEISMIC EVENT · {new Date(selected.time).toLocaleString()}</span><div className="toast-magnitude">M<span>{selected.magnitude.toFixed(1)}</span></div><h2 id="event-toast-title">{selected.place}</h2><p className="toast-caption">Earth moved here. Here’s the signal.</p><div className="toast-data"><span>Depth<strong>{selected.depth.toFixed(1)} km</strong></span><span>Coordinates<strong>{selected.lat.toFixed(2)}°, {selected.lng.toFixed(2)}°</strong></span><span>Stations<strong>{selected.nst ?? "—"}</strong></span></div><button className="toast-return" onClick={() => setEventToastOpen(false)}>Back to live map <span aria-hidden="true">↗</span></button></div></section></div>}
    </main>
  );
};

export default App;


