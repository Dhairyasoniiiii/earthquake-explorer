// src/components/ChartPanel.tsx
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Earthquake } from "../types";

interface ChartPanelProps {
  earthquakes: Earthquake[];
  onSelect?: (eq: Earthquake) => void;
}

/**
 * Displays a time vs magnitude chart using Recharts.
 */
export const ChartPanel: React.FC<ChartPanelProps> = ({
  earthquakes,
  onSelect,
}) => {
  const chartData = useMemo(
    () =>
      earthquakes
        .map((eq) => ({
          time: new Date(eq.time).toLocaleDateString(),  // Ensure date is properly formatted
          magnitude: eq.magnitude,
          id: eq.id,
        }))
        .slice(-1000), // limit to last 1000 to keep it fast
    [earthquakes]
  );

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
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
          <XAxis dataKey="time" stroke="#ccc" />
          <YAxis
            stroke="#ccc"
            domain={["auto", "auto"]}
            label={{
              value: "Magnitude",
              angle: -90,
              position: "insideLeft",
              fill: "#ccc",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "none",
              color: "white",
            }}
          />
          <Line
            type="monotone"
            dataKey="magnitude"
            stroke="#ff7300"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
