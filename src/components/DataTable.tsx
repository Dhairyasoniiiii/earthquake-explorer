import React, { memo, useEffect, useRef } from "react";
import type { Earthquake } from "../types";

interface DataTableProps {
  earthquakes: Earthquake[];
  selectedEarthquake: Earthquake | null;
  onSelect: (earthquake: Earthquake) => void;
}

const DataTableComponent: React.FC<DataTableProps> = ({ earthquakes, selectedEarthquake, onSelect }) => {
  const selectedRow = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    selectedRow.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedEarthquake?.id]);

  return <table className="events-table">
    <thead><tr><th scope="col">Location</th><th scope="col">Mag</th><th scope="col">Depth</th><th scope="col">Time</th></tr></thead>
    <tbody>{earthquakes.map((event) => {
      const selected = selectedEarthquake?.id === event.id;
      return <tr key={event.id} ref={selected ? selectedRow : null} className={selected ? "is-selected" : undefined}>
        <td><button className="event-link" onClick={() => onSelect(event)} aria-pressed={selected}>{event.place}</button></td>
        <td><span className={`magnitude-chip ${event.magnitude >= 5 ? "is-high" : ""}`}>{event.magnitude.toFixed(1)}</span></td>
        <td>{event.depth.toFixed(1)} km</td>
        <td><time dateTime={new Date(event.time).toISOString()}>{new Date(event.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></td>
      </tr>;
    })}</tbody>
  </table>;
};

export default memo(DataTableComponent);
