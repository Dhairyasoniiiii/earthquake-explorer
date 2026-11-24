import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Earthquake } from "../types";

interface DataTableProps {
  earthquakes: Earthquake[];
  selectedEarthquake: Earthquake | null;
  onSelect: (earthquake: Earthquake) => void;
}

const DataTableComponent: React.FC<DataTableProps> = ({ earthquakes, selectedEarthquake, onSelect }) => {
  const selectedRow = useRef<HTMLTableRowElement>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(earthquakes.length / pageSize));
  const visibleEarthquakes = useMemo(
    () => earthquakes.slice(page * pageSize, (page + 1) * pageSize),
    [earthquakes, page],
  );

  useEffect(() => {
    if (!selectedEarthquake) {
      setPage((current) => Math.min(current, pageCount - 1));
      return;
    }
    const index = earthquakes.findIndex((event) => event.id === selectedEarthquake.id);
    if (index >= 0) setPage(Math.floor(index / pageSize));
    else setPage((current) => Math.min(current, pageCount - 1));
  }, [earthquakes, selectedEarthquake?.id, pageCount]);

  useEffect(() => {
    selectedRow.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedEarthquake?.id, page]);

  return <table className="events-table">
    <thead><tr><th scope="col">Location</th><th scope="col">Mag</th><th scope="col">Depth</th><th scope="col">Time</th></tr></thead>
    <tbody>{visibleEarthquakes.map((event) => {
      const selected = selectedEarthquake?.id === event.id;
      return <tr key={event.id} ref={selected ? selectedRow : null} className={selected ? "is-selected" : undefined}>
        <td><button className="event-link" onClick={() => onSelect(event)} aria-pressed={selected}>{event.place}</button></td>
        <td><span className={`magnitude-chip ${event.magnitude >= 5 ? "is-high" : ""}`}>{event.magnitude.toFixed(1)}</span></td>
        <td>{event.depth.toFixed(1)} km</td>
        <td><time dateTime={new Date(event.time).toISOString()}>{new Date(event.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></td>
      </tr>;
    })}</tbody>
    <tfoot><tr><td colSpan={4}><div className="table-pagination"><span>{earthquakes.length ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, earthquakes.length)} of ${earthquakes.length.toLocaleString()}` : "0 events"}</span><div><button type="button" className="page-button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Previous events">‹</button><span>Page {page + 1} of {pageCount}</span><button type="button" className="page-button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} aria-label="Next events">›</button></div></div></td></tr></tfoot>
  </table>;
};

export default memo(DataTableComponent);
