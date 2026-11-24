import React, { memo, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Earthquake } from "../types";

interface ChartPanelProps {
  earthquakes: Earthquake[];
  onSelect?: (earthquake: Earthquake) => void;
}

const numericOptions: Array<{ key: keyof Earthquake; label: string }> = [
  { key: "magnitude", label: "Magnitude" }, { key: "depth", label: "Depth (km)" },
  { key: "lat", label: "Latitude" }, { key: "lng", label: "Longitude" },
  { key: "nst", label: "Stations" }, { key: "gap", label: "Azimuthal gap" },
  { key: "dmin", label: "Minimum distance" }, { key: "rms", label: "RMS" },
  { key: "horizontalError", label: "Horizontal error" }, { key: "depthError", label: "Depth error" },
  { key: "magError", label: "Magnitude error" }, { key: "magNst", label: "Magnitude stations" },
];
const timeOption = { key: "time" as const, label: "Time" };
const MAX_CHART_POINTS = 1_000;
const numberOrNull = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;

const ChartPanelComponent: React.FC<ChartPanelProps> = ({ earthquakes, onSelect }) => {
  const [xKey, setXKey] = useState<keyof Earthquake>("time");
  const [yKey, setYKey] = useState<keyof Earthquake>("magnitude");
  const options = useMemo(() => [timeOption, ...numericOptions], []);
  const chartData = useMemo(() => earthquakes
    .filter((event) => Number.isFinite(event.time) && Number.isFinite(event.magnitude))
    .slice(0, MAX_CHART_POINTS)
    .sort((a, b) => a.time - b.time), [earthquakes]);
  const scatterData = useMemo(() => chartData.filter((event) =>
    numberOrNull(event[xKey]) !== null && numberOrNull(event[yKey]) !== null), [chartData, xKey, yKey]);
  const selectActive = (state: { activePayload?: Array<{ payload?: Earthquake }> } | null) => {
    const event = state?.activePayload?.[0]?.payload;
    if (event) onSelect?.(event);
  };
  const formatTime = (value: number) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return <div className="chart-content">
    <div className="chart-controls">
      <label><span>X axis</span><select value={xKey} onChange={(event) => setXKey(event.target.value as keyof Earthquake)}>{options.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label><span>Y axis</span><select value={yKey} onChange={(event) => setYKey(event.target.value as keyof Earthquake)}>{numericOptions.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    {xKey === "time" ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: -16 }} onClick={selectActive}>
      <CartesianGrid stroke="rgba(210,230,244,.08)" vertical={false} />
      <XAxis dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={formatTime} minTickGap={28} stroke="#8295a7" tick={{ fontSize: 10 }} />
      <YAxis dataKey={yKey} type="number" domain={["auto", "auto"]} stroke="#8295a7" tick={{ fontSize: 10 }} />
      <Tooltip contentStyle={{ background: "rgba(13,25,38,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#eef6fa" }} labelFormatter={(value) => new Date(Number(value)).toLocaleString()} />
      <Line type="monotone" dataKey={yKey} name={String(yKey)} stroke="#67d9d0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#a4f4e8", stroke: "#132a37", strokeWidth: 2 }} isAnimationActive={false} />
    </LineChart></ResponsiveContainer> : <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -16 }} onClick={selectActive}>
      <CartesianGrid stroke="rgba(210,230,244,.08)" />
      <XAxis dataKey={xKey} type="number" name={String(xKey)} domain={["auto", "auto"]} stroke="#8295a7" tick={{ fontSize: 10 }} />
      <YAxis dataKey={yKey} type="number" name={String(yKey)} domain={["auto", "auto"]} stroke="#8295a7" tick={{ fontSize: 10 }} />
      <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "rgba(13,25,38,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#eef6fa" }} />
      <Scatter name="Earthquakes" data={scatterData} fill="#67d9d0" onClick={(event) => { if (event?.id) onSelect?.(event as Earthquake); }} isAnimationActive={false} />
    </ScatterChart></ResponsiveContainer>}
  </div>;
};

export const ChartPanel = memo(ChartPanelComponent);
