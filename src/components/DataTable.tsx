import React, { useEffect, useRef, memo } from "react";
import type { Earthquake } from "../types";

interface DataTableProps {
  earthquakes: Earthquake[];
  selectedEarthquake: Earthquake | null;
  onSelect: (eq: Earthquake) => void;
  style?: React.CSSProperties;
}

const DataTableComponent: React.FC<DataTableProps> = ({
  earthquakes,
  selectedEarthquake,
  onSelect,
  style,
}) => {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    if (selectedEarthquake) {
      const index = earthquakes.findIndex((eq) => eq.id === selectedEarthquake.id);
      if (index >= 0 && rowRefs.current[index]) {
        rowRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedEarthquake, earthquakes]);

  return (
    <div style={{ overflow: "auto", ...style }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ position: "sticky", top: 0, background: "#0b1220", color: "white" }}>
          <tr>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Place</th>
            <th style={{ padding: "8px 12px", textAlign: "right" }}>Magnitude</th>
            <th style={{ padding: "8px 12px", textAlign: "right" }}>Depth (km)</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {earthquakes.map((eq, i) => {
            const isSelected = selectedEarthquake?.id === eq.id;
            return (
              <tr
                key={eq.id}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                onClick={() => onSelect(eq)}
                style={{
                  background: isSelected ? "rgba(255, 165, 0, 0.12)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {eq.place}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {eq.magnitude.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {eq.depth.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {new Date(eq.time).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
const DataTable = memo(DataTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.earthquakes.length === nextProps.earthquakes.length &&
    prevProps.selectedEarthquake?.id === nextProps.selectedEarthquake?.id
  );
});

export default DataTable;
