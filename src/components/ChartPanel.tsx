// src/components/ChartPanel.tsx
import React, { useMemo, useState, memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import type { Earthquake } from "../types";

interface ChartPanelProps {
  earthquakes: Earthquake[];
  onSelect?: (eq: Earthquake) => void;
}

/**
 * Displays a time vs magnitude chart using Recharts.
 */
const ChartPanelComponent: React.FC<ChartPanelProps> = ({
  earthquakes,
  onSelect,
}) => {
  const [xKey, setXKey] = useState<keyof Earthquake | "">("time");
  const [yKey, setYKey] = useState<keyof Earthquake | "">("magnitude");

  // Numeric keys that make sense for axis selection
  const numericOptions: Array<{ key: keyof Earthquake; label: string }> = useMemo(() => [
    { key: "time", label: "Time" },
    { key: "magnitude", label: "Magnitude" },
    { key: "depth", label: "Depth (km)" },
    { key: "lat", label: "Latitude" },
    { key: "lng", label: "Longitude" },
    { key: "nst", label: "Stations (nst)" },
    { key: "gap", label: "Azimuthal Gap" },
    { key: "dmin", label: "Distance Min (dmin)" },
    { key: "rms", label: "RMS" },
    { key: "horizontalError", label: "Horizontal Error" },
    { key: "depthError", label: "Depth Error" },
    { key: "magError", label: "Magnitude Error" },
    { key: "magNst", label: "Mag Stations (magNst)" },
  ], []);

  const chartData = useMemo(() => {
    return earthquakes
      .map((eq) => ({ ...eq }))
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
      .slice(-2000);
  }, [earthquakes]);

  const isTimeSeries = xKey === "time";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 10, flexShrink: 0 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#06b6d4" }}>X axis:</span>
          <select
            value={xKey}
            onChange={(e) => setXKey(e.target.value as keyof Earthquake)}
            className="nice-select"
            style={{ 
              padding: "6px 12px",
              borderRadius: 8,
              border: "2px solid rgba(139, 92, 246, 0.3)",
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.6)";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))";
            }}
          >
            {numericOptions.map((o) => (
              <option key={o.key as string} value={o.key as string} style={{ background: "#1e293b", color: "#fff" }}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#ec4899" }}>Y axis:</span>
          <select
            value={yKey}
            onChange={(e) => setYKey(e.target.value as keyof Earthquake)}
            className="nice-select"
            style={{ 
              padding: "6px 12px",
              borderRadius: 8,
              border: "2px solid rgba(236, 72, 153, 0.3)",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.6)";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.3)";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))";
            }}
          >
            {numericOptions.map((o) => (
              <option key={o.key as string} value={o.key as string} style={{ background: "#1e293b", color: "#fff" }}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer>
        {isTimeSeries ? (
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            onClick={(e) => {
              if (onSelect && e?.activePayload?.[0]?.payload) {
                const payload = e.activePayload[0].payload;
                const found = earthquakes.find((eq) => eq.id === payload.id);
                if (found) onSelect(found);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis
              dataKey="time"
              type="number"
              domain={["auto", "auto"]}
              scale="time"
              tickFormatter={(v) => new Date(v).toLocaleDateString()}
              minTickGap={40}
              stroke="#ccc"
            />
            <YAxis stroke="#ccc" domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", color: "white" }}
              labelFormatter={(v) => new Date(Number(v)).toLocaleString()}
            />
            <Line type="monotone" dataKey={yKey as string} name={String(yKey)} stroke="#ff9f0a" dot={false} />
          </LineChart>
        ) : (
          <ScatterChart
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            onClick={(e) => {
              if (onSelect && e?.activePayload?.[0]?.payload) {
                const payload = e.activePayload[0].payload;
                const found = earthquakes.find((eq) => eq.id === payload.id);
                if (found) onSelect(found);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis
              dataKey={xKey as string}
              type="number"
              domain={["auto", "auto"]}
              scale="linear"
              tickFormatter={(v) => v as any}
              stroke="#ccc"
            />
            <YAxis dataKey={yKey as string} type="number" domain={["auto", "auto"]} stroke="#ccc" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", color: "white" }}
              formatter={(value: any, name: any) => [String(value), String(name)]}
              labelFormatter={() => ""}
            />
            <Scatter name="Earthquakes" data={chartData.filter((d) => Number.isFinite((d as any)[xKey]) && Number.isFinite((d as any)[yKey]))} fill="#ff9f0a" />
          </ScatterChart>
        )}
      </ResponsiveContainer>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ChartPanel = memo(ChartPanelComponent, (prevProps, nextProps) => {
  return prevProps.earthquakes.length === nextProps.earthquakes.length;
});
