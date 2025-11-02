import React, { useEffect, useMemo, useState } from "react";
import DataTable from "./components/DataTable";
import { ChartPanel } from "./components/ChartPanel";
import { GlobePanel } from "./components/GlobePanel";
import type { Earthquake } from "./types";
import type { GlobePoint } from "./components/GlobePanel";

/** Parse USGS CSV feed into Earthquake objects */
const parseUSGSCsv = (csvText: string): Earthquake[] => {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  const idI = idx("id");
  const placeI = idx("place");
  const magI = idx("mag");
  const depthI = idx("depth");
  const latI = idx("latitude");
  const lonI = idx("longitude");
  const timeI = idx("time");

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",", headers.length).map((c) => c.trim());
      const parsedTime = Date.parse(cols[timeI] || "") || 0;
      return {
        id: cols[idI] || `${Math.random()}`,
        place: cols[placeI] || "Unknown",
        magnitude: Number.parseFloat(cols[magI] || "0") || 0,
        depth: Number.parseFloat(cols[depthI] || "0") || 0,
        lat: Number.parseFloat(cols[latI] || "0") || 0,
        lng: Number.parseFloat(cols[lonI] || "0") || 0,
        time: parsedTime,
      } as Earthquake;
    })
    .filter((e) => !Number.isNaN(e.lat) && !Number.isNaN(e.lng));
};

const App: React.FC = () => {
  const [earthquakeData, setEarthquakeData] = useState<Earthquake[]>([]);
  const [selected, setSelected] = useState<Earthquake | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [altitudeField, setAltitudeField] = useState<"magnitude" | "depth">("magnitude");

  /** Fetch earthquake data from USGS */
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (cancelled) return;
        const parsed = parseUSGSCsv(text);
        setEarthquakeData(parsed);
      } catch (err) {
        console.error("Failed to fetch earthquake data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Convert Earthquake[] → GlobePoint[] for 3D globe */
  const globePoints = useMemo<GlobePoint[]>(
    () =>
      earthquakeData.map((eq) => ({
        id: eq.id,
        lat: eq.lat,
        lng: eq.lng,
        altitude: altitudeField === "magnitude" ? eq.magnitude : eq.depth,
        color: eq.magnitude >= 5 ? "orangered" : "orange",
        label: `${eq.place} — mag ${eq.magnitude.toFixed(1)}`,
      })),
    [earthquakeData, altitudeField]
  );

  const handleSelect = (eq: Earthquake) => setSelected(eq);

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
        color: "white",
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      }}
    >
      <header
        style={{
          padding: 16,
          fontSize: 20,
          fontWeight: 700,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        🌎 Earthquake Explorer
      </header>

      {loading ? (
        <div style={{ padding: 20 }}>Loading earthquake data...</div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 12,
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Left column: chart + globe */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <ChartPanel earthquakes={earthquakeData} onSelect={handleSelect} />
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                padding: 8,
                flex: 1,
                minHeight: 200,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <label style={{ marginRight: 8 }}>
                  Globe altitude:
                  <select
                    value={altitudeField}
                    onChange={(e) =>
                      setAltitudeField(e.target.value as "magnitude" | "depth")
                    }
                    style={{ marginLeft: 8 }}
                  >
                    <option value="magnitude">Magnitude</option>
                    <option value="depth">Depth</option>
                  </select>
                </label>
              </div>

              <div style={{ height: 300 }}>
                <GlobePanel
                  pointsData={globePoints}
                  altitudeField="altitude"
                  onPointClick={(p: GlobePoint) => {
                    const eq = earthquakeData.find((e) => e.id === p.id);
                    if (eq) setSelected(eq);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right column: data table + selected details */}
          <div
            style={{
              width: 420,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>Data Table</div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <DataTable
                earthquakes={earthquakeData}
                selectedEarthquake={selected}
                onSelect={handleSelect}
                style={{ height: "100%" }}
              />
            </div>

            {selected && (
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                <strong>{selected.place}</strong>
                <div>Magnitude: {selected.magnitude}</div>
                <div>Depth: {selected.depth} km</div>
                <div>Time: {new Date(selected.time).toLocaleString()}</div>
                <div>
                  Coords: {selected.lat}, {selected.lng}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
