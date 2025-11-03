/**
 * Earthquake Explorer - Main Application Component
 * 
 * This app visualizes real-time earthquake data from USGS in multiple ways:
 * - Interactive 2D charts showing relationships between variables
 * - Sortable data table with all earthquake details
 * - 3D globe view showing earthquakes geographically
 * 
 * The app demonstrates different state management patterns:
 * - Props: passing data from parent to child components
 * - Zustand: global store for selected earthquake
 * - Local state: UI controls and filtered data
 */

import React, { useEffect, useMemo, useState } from "react";
import DataTable from "./components/DataTable";
import { ChartPanel } from "./components/ChartPanel";
import { GlobePanel } from "./components/GlobePanel";
import type { Earthquake } from "./types";
import type { GlobePoint } from "./components/GlobePanel";

/**
 * Parses the USGS CSV earthquake feed into structured objects.
 * Handles quoted strings properly since some place names contain commas.
 * Returns an array of earthquake records with all available fields.
 */
const parseUSGSCsv = (csvText: string): Earthquake[] => {
  const lines = csvText
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Simple CSV splitter handling quotes
  const splitCsv = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++; // escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = splitCsv(lines[0]).map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  const idI = idx("id");
  const placeI = idx("place");
  const magI = idx("mag");
  const depthI = idx("depth");
  const latI = idx("latitude");
  const lonI = idx("longitude");
  const timeI = idx("time");
  const magTypeI = idx("magType");
  const typeI = idx("type");
  const nstI = idx("nst");
  const gapI = idx("gap");
  const dminI = idx("dmin");
  const rmsI = idx("rms");
  const horErrI = idx("horizontalError");
  const depErrI = idx("depthError");
  const magErrI = idx("magError");
  const magNstI = idx("magNst");

  const toNum = (s: string | undefined) => {
    if (s == null || s === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  return lines.slice(1).map((line) => {
    const cols = splitCsv(line);
    const timeVal = cols[timeI] ?? "";
    const parsedTime = Date.parse(timeVal) || toNum(timeVal) || 0;
    const e: Earthquake = {
      id: cols[idI] || `${Math.random()}`,
      place: cols[placeI] || "Unknown",
      magnitude: toNum(cols[magI]) ?? 0,
      depth: toNum(cols[depthI]) ?? 0,
      lat: toNum(cols[latI]) ?? 0,
      lng: toNum(cols[lonI]) ?? 0,
      time: typeof parsedTime === "number" ? parsedTime : 0,
      magType: magTypeI >= 0 ? cols[magTypeI] || undefined : undefined,
      type: typeI >= 0 ? cols[typeI] || undefined : undefined,
      nst: toNum(cols[nstI]),
      gap: toNum(cols[gapI]),
      dmin: toNum(cols[dminI]),
      rms: toNum(cols[rmsI]),
      horizontalError: toNum(cols[horErrI]),
      depthError: toNum(cols[depErrI]),
      magError: toNum(cols[magErrI]),
      magNst: toNum(cols[magNstI]),
    };
    return e;
  }).filter((e) => !Number.isNaN(e.lat) && !Number.isNaN(e.lng));
};

const App: React.FC = () => {
  // Main data storage - holds all earthquake records from USGS
  const [earthquakeData, setEarthquakeData] = useState<Earthquake[]>([]);
  
  // Currently selected earthquake (clicking table row or chart point)
  const [selected, setSelected] = useState<Earthquake | null>(null);
  
  // Show loading spinner while fetching initial data
  const [loading, setLoading] = useState<boolean>(true);
  
  // What property to use for 3D height on the globe (magnitude/depth/station count/gap)
  const [altitudeField, setAltitudeField] = useState<"magnitude" | "depth" | "nst" | "gap">("magnitude");
  
  // Controls whether the data table is collapsed or expanded
  const [tableCollapsed, setTableCollapsed] = useState<boolean>(false);
  
  // Minimum magnitude filter - only show quakes >= this value
  const [magMin, setMagMin] = useState<number>(0);
  
  // Whether the full-screen globe modal is open
  const [showGlobeModal, setShowGlobeModal] = useState<boolean>(false);
  
  // Size of earthquake points on the globe (user adjustable)
  const [modalPointScale, setModalPointScale] = useState<number>(0.3);
  
  // What property determines point color on the globe
  const [colorBy, setColorBy] = useState<"magnitude" | "depth" | "nst" | "gap">("magnitude");
  
  // Temporary notification message (auto-dismisses after 4 seconds)
  const [toast, setToast] = useState<{ title: string; lines: string[] } | null>(null);
  
  // Tracks if we've hit the API rate limit (10 requests per minute)
  const [rateLimitReached, setRateLimitReached] = useState<boolean>(false);

  /**
   * Fetches earthquake data from USGS and sets up auto-refresh.
   * Includes rate limiting to avoid overwhelming the API.
   * Refreshes every 10 seconds but caps at 10 requests per minute.
   */
  useEffect(() => {
    let cancelled = false;
    let resetTimer: ReturnType<typeof setTimeout>;

    // Get rate limit data from localStorage
    const getRateLimitData = () => {
      const data = localStorage.getItem('earthquakeRefreshLimit');
      if (!data) return { count: 0, resetTime: Date.now() + 60000 };
      try {
        return JSON.parse(data);
      } catch {
        return { count: 0, resetTime: Date.now() + 60000 };
      }
    };

    // Save rate limit data to localStorage
    const saveRateLimitData = (count: number, resetTime: number) => {
      localStorage.setItem('earthquakeRefreshLimit', JSON.stringify({ count, resetTime }));
    };

    const fetchData = async () => {
      const limitData = getRateLimitData();
      const now = Date.now();

      // Reset counter if 1 minute has passed
      if (now >= limitData.resetTime) {
        limitData.count = 0;
        limitData.resetTime = now + 60000;
        saveRateLimitData(limitData.count, limitData.resetTime);
        setRateLimitReached(false);
      }

      // Rate limit: max 10 requests per minute
      if (limitData.count >= 10) {
        console.warn("Rate limit reached: Maximum 10 refreshes per minute");
        setRateLimitReached(true);
        saveRateLimitData(limitData.count, limitData.resetTime);
        return;
      }

      limitData.count++;
      saveRateLimitData(limitData.count, limitData.resetTime);
      setRateLimitReached(false);
      
      const isFirstLoad = limitData.count === 1;
      setLoading(isFirstLoad); // Only show loading screen on first fetch

      try {
        const res = await fetch(
          "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.csv"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (cancelled) return;
        const parsed = parseUSGSCsv(text);
        setEarthquakeData(parsed);
        console.log(`Fetched data - Request ${limitData.count}/10 in current minute`);
      } catch (err) {
        console.error("Failed to fetch earthquake data:", err);
      } finally {
        if (!cancelled && isFirstLoad) setLoading(false);
      }
    };

    // Check initial rate limit status
    const initialData = getRateLimitData();
    const now = Date.now();
    if (now >= initialData.resetTime) {
      // Reset if time has passed
      saveRateLimitData(0, now + 60000);
      setRateLimitReached(false);
    } else if (initialData.count >= 10) {
      setRateLimitReached(true);
    }

    // Reset rate limit check every 5 seconds
    const resetCheck = () => {
      const limitData = getRateLimitData();
      const now = Date.now();
      if (now >= limitData.resetTime) {
        console.log("Rate limit window reset");
        saveRateLimitData(0, now + 60000);
        setRateLimitReached(false);
      }
      resetTimer = setTimeout(resetCheck, 5000);
    };
    resetCheck();

    fetchData();
    
    // Refresh every 10 seconds (max 10 per minute)
    const interval = setInterval(() => {
      if (!cancelled) {
        fetchData();
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(resetTimer);
    };
  }, [rateLimitReached]);

  /**
   * Converts earthquake data to globe points for 3D visualization.
   * Each earthquake becomes a point on the globe with:
   * - Geographic position (lat/lng)
   * - Height based on selected field (magnitude, depth, etc.)
   * - Color based on magnitude severity
   */
  const globePoints = useMemo<GlobePoint[]>(
    () =>
      earthquakeData.map((eq) => ({
        id: eq.id,
        lat: eq.lat,
        lng: eq.lng,
        altitude: 
          altitudeField === "magnitude" ? eq.magnitude : 
          altitudeField === "depth" ? eq.depth :
          // Station count and gap values are scaled down since they're typically large numbers
          altitudeField === "nst" ? (eq.nst || 0) / 100 :
          (eq.gap || 0) / 100,
        color: eq.magnitude >= 5 ? "orangered" : "orange",
        label: `${eq.place} — mag ${eq.magnitude.toFixed(1)}`,
      })),
    [earthquakeData, altitudeField]
  );

  const handleSelect = (eq: Earthquake) => setSelected(eq);

  // Filters earthquakes based on minimum magnitude slider
  const filteredEarthquakes = useMemo(() => {
    return earthquakeData.filter((e) => (e.magnitude ?? 0) >= magMin);
  }, [earthquakeData, magMin]);

  // Calculates statistics for the filtered dataset
  const stats = useMemo(() => {
    const count = filteredEarthquakes.length;
    const maxMag = filteredEarthquakes.reduce((m, e) => Math.max(m, e.magnitude ?? 0), 0);
    const avgMag = count
      ? filteredEarthquakes.reduce((s, e) => s + (e.magnitude ?? 0), 0) / count
      : 0;
    return { count, maxMag, avgMag };
  }, [filteredEarthquakes]);

  /**
   * Generates globe points for the modal view with dynamic coloring.
   * Colors are mapped on a gradient from cyan (low values) to red (high values)
   * based on the selected color-by field.
   */
  const modalPoints = useMemo<GlobePoint[]>(() => {
    // Build points with color mapping based on selected colorBy
    const colorScale = (val: number | undefined, min: number, max: number) => {
      if (val == null || !Number.isFinite(val)) return "#ff9f0a";
      const t = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
      // gradient from cyan (#36c1ff) to orange (#ff9f0a) to red (#ff3b30)
      const stops = [
        { r: 54, g: 193, b: 255 },
        { r: 255, g: 159, b: 10 },
        { r: 255, g: 59, b: 48 },
      ];
      const seg = t * (stops.length - 1);
      const i = Math.floor(seg);
      const f = seg - i;
      const a = stops[i];
      const b = stops[Math.min(i + 1, stops.length - 1)];
      const r = Math.round(a.r + (b.r - a.r) * f);
      const g = Math.round(a.g + (b.g - a.g) * f);
      const bch = Math.round(a.b + (b.b - a.b) * f);
      return `rgb(${r},${g},${bch})`;
    };

    const vals = filteredEarthquakes.map((e) => {
      if (colorBy === "magnitude") return e.magnitude || 0;
      if (colorBy === "depth") return e.depth || 0;
      if (colorBy === "nst") return e.nst || 0;
      return e.gap || 0;
    });
    const minV = Math.min(...vals, 0);
    const maxV = Math.max(...vals, 1);

    return filteredEarthquakes.map((eq) => {
      const colorVal = colorBy === "magnitude" ? eq.magnitude : 
                       colorBy === "depth" ? eq.depth :
                       colorBy === "nst" ? eq.nst :
                       eq.gap;
      
      return {
        id: eq.id,
        lat: eq.lat,
        lng: eq.lng,
        altitude: 
          altitudeField === "magnitude" ? eq.magnitude : 
          altitudeField === "depth" ? eq.depth :
          altitudeField === "nst" ? (eq.nst || 0) / 100 :
          (eq.gap || 0) / 100,
        color: colorScale(colorVal, minV, maxV),
        label: `${eq.place} — mag ${eq.magnitude.toFixed(1)}`,
      };
    });
  }, [filteredEarthquakes, colorBy, altitudeField]);

  return (
    <div
      className="app-bg"
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: "white",
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      }}
    >
      {/* Rate Limit Toast - Only show when not loading */}
      {rateLimitReached && !loading && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 59, 48, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 10,
            padding: "12px 20px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            zIndex: 10000,
            animation: "toastIn 0.3s ease-out",
            textAlign: "center",
            minWidth: 400,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            ⚠️ Maximum Refresh Limit Reached
          </div>
          <div style={{ fontSize: 13, opacity: 0.95 }}>
            The page has reached the maximum refresh limit. Please wait for some time and try again later.
          </div>
        </div>
      )}
      
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 40,
            position: "relative",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          {/* Modern loading spinner */}
          <div style={{ position: "relative", width: 200, height: 200, willChange: "transform" }}>
            {/* Outer orbit ring */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "4px solid transparent",
                borderTopColor: "#06b6d4",
                borderRightColor: "#06b6d4",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                willChange: "transform",
              }}
            />
            {/* Middle orbit ring */}
            <div
              style={{
                position: "absolute",
                inset: 25,
                border: "4px solid transparent",
                borderTopColor: "#8b5cf6",
                borderLeftColor: "#8b5cf6",
                borderRadius: "50%",
                animation: "spin 1.5s linear infinite reverse",
                willChange: "transform",
              }}
            />
            {/* Inner orbit ring */}
            <div
              style={{
                position: "absolute",
                inset: 50,
                border: "4px solid transparent",
                borderTopColor: "#ec4899",
                borderBottomColor: "#ec4899",
                borderRadius: "50%",
                animation: "spin 2s linear infinite",
                willChange: "transform",
              }}
            />
            {/* Center logo */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 2s ease-in-out infinite",
                willChange: "transform, opacity",
              }}
            >
              <svg width="80" height="80" viewBox="0 0 200 200" fill="none">
                {/* Simple geometric E letter */}
                <rect x="60" y="50" width="15" height="100" fill="url(#letterGrad)" rx="3"/>
                <rect x="60" y="50" width="70" height="15" fill="url(#letterGrad)" rx="3"/>
                <rect x="60" y="92.5" width="60" height="15" fill="url(#letterGrad)" rx="3"/>
                <rect x="60" y="135" width="70" height="15" fill="url(#letterGrad)" rx="3"/>
                
                {/* Zigzag accent - earthquake motif */}
                <path d="M 140 70 L 155 85 L 145 100 L 160 115 L 150 130" 
                      stroke="url(#accentGrad)" 
                      strokeWidth="6" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"/>
                
                <defs>
                  <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4"/>
                    <stop offset="50%" stopColor="#8b5cf6"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                  <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24"/>
                    <stop offset="100%" stopColor="#ef4444"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Loading text with gradient */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)",
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
              letterSpacing: "1px",
              marginTop: "40px",
              willChange: "background-position",
            }}
          >
            Loading Earthquake Data
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 12, marginTop: "30px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                  animation: `bounceIn 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  willChange: "transform",
                }}
              />
            ))}
          </div>

          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
              
              @keyframes shimmer {
                0% { background-position: 0% center; }
                100% { background-position: 300% center; }
              }
              
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
              }
            `}
          </style>
        </div>
      ) : rateLimitReached ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 24,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 72 }}>⚠️</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            Maximum Refresh Limit Reached
          </div>
          <div style={{ fontSize: 16, opacity: 0.8, maxWidth: 500 }}>
            The page has reached the maximum refresh limit of 10 requests per minute.
            Please wait for some time and try again later.
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginTop: 16 }}>
            The page will automatically resume in the next minute.
          </div>
        </div>
      ) : (
        <div
          className="nice-scroll"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 16,
            gap: 16,
            height: "100%",
            boxSizing: "border-box",
            overflow: "auto",
            animation: "fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Top: Stats + Filter Bar */}
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              padding: "12px 16px",
            }}
          >
            {/* Logo and Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="40" height="40" viewBox="0 0 200 200" fill="none">
                <rect x="60" y="50" width="15" height="100" fill="url(#hLetterGrad)" rx="3"/>
                <rect x="60" y="50" width="70" height="15" fill="url(#hLetterGrad)" rx="3"/>
                <rect x="60" y="92.5" width="60" height="15" fill="url(#hLetterGrad)" rx="3"/>
                <rect x="60" y="135" width="70" height="15" fill="url(#hLetterGrad)" rx="3"/>
                <path d="M 140 70 L 155 85 L 145 100 L 160 115 L 150 130" 
                      stroke="url(#hAccentGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="hLetterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4"/>
                    <stop offset="50%" stopColor="#8b5cf6"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                  <linearGradient id="hAccentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24"/>
                    <stop offset="100%" stopColor="#ef4444"/>
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Earthquake Explorer</span>
            </div>
            
            {/* Stats in the middle */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, justifyContent: "center" }}>
              <span style={{ 
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))", 
                padding: "8px 14px", 
                borderRadius: 8, 
                fontSize: 13,
                border: "1px solid rgba(6, 182, 212, 0.3)",
                boxShadow: "0 2px 8px rgba(6, 182, 212, 0.2)"
              }}>
                Events: <strong style={{ color: "#06b6d4" }}>{stats.count}</strong>
              </span>
              <span style={{ 
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))", 
                padding: "8px 14px", 
                borderRadius: 8, 
                fontSize: 13,
                border: "1px solid rgba(139, 92, 246, 0.3)",
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.2)"
              }}>
                Max Mag: <strong style={{ color: "#8b5cf6" }}>{stats.maxMag.toFixed(1)}</strong>
              </span>
              <span style={{ 
                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1))", 
                padding: "8px 14px", 
                borderRadius: 8, 
                fontSize: 13,
                border: "1px solid rgba(236, 72, 153, 0.3)",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.2)"
              }}>
                Avg Mag: <strong style={{ color: "#ec4899" }}>{stats.avgMag.toFixed(1)}</strong>
              </span>
            </div>
            
            {/* Filter on the right */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                Magnitude: <strong>{magMin.toFixed(1)}+</strong>
              </label>
              <input
                type="range"
                min={0}
                max={8}
                step={0.1}
                value={magMin}
                onChange={(e) => setMagMin(parseFloat(e.target.value))}
                style={{ width: 120 }}
              />
            </div>
          </div>

          {/* Main Content: Two Columns */}
          <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
            {/* Left: Chart + Globe */}
            <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              {/* Chart */}
              <div className="card" style={{ padding: 12, height: "35%", minHeight: 0 }}>
                <ChartPanel earthquakes={filteredEarthquakes} onSelect={handleSelect} />
              </div>

              {/* Globe */}
              <div className="card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 12 }}>
                {/* Floating controls */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10,
                  background: "rgba(15,20,35,0.85)",
                  backdropFilter: "blur(8px)",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: 12,
                  flexShrink: 0,
                }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#8b5cf6" }}>Height Mode:</span>
                    <select
                      value={altitudeField}
                      onChange={(e) => setAltitudeField(e.target.value as "magnitude" | "depth" | "nst" | "gap")}
                      className="nice-select"
                      style={{ 
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "2px solid rgba(139, 92, 246, 0.3)",
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.6)";
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))";
                      }}
                    >
                      <option value="magnitude" style={{ background: "#1e293b", color: "#fff" }}>Magnitude</option>
                      <option value="depth" style={{ background: "#1e293b", color: "#fff" }}>Depth (km)</option>
                      <option value="nst" style={{ background: "#1e293b", color: "#fff" }}>Station Count</option>
                      <option value="gap" style={{ background: "#1e293b", color: "#fff" }}>Azimuthal Gap</option>
                    </select>
                  </label>
                  <button className="btn" onClick={() => setShowGlobeModal(true)} style={{ marginLeft: "auto", fontSize: 12 }}>
                    ⛶ Expand
                  </button>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 0,
                    minWidth: 0,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "min(90%, 450px)",
                      aspectRatio: "1",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        borderRadius: "50%",
                      }}
                    >
                      <GlobePanel
                        pointsData={globePoints.filter((p) => {
                          const eq = earthquakeData.find((e) => e.id === p.id);
                          return (eq?.magnitude ?? 0) >= magMin;
                        })}
                        altitudeField="altitude"
                        onPointClick={(p: GlobePoint) => {
                          const eq = filteredEarthquakes.find((e) => e.id === p.id);
                          if (eq) setSelected(eq);
                        }}
                        height="100%"
                        enableZoom={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Data Table + Details */}
            <div style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              {/* Data Table */}
              <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    padding: "10px 12px",
                    borderBottom: tableCollapsed ? "none" : "1px solid rgba(255,255,255,0.08)",
                    flexShrink: 0,
                  }}
                  onClick={() => setTableCollapsed((c) => !c)}
                  title={tableCollapsed ? "Expand data table" : "Collapse data table"}
                >
                  <span>📊 Data Table ({stats.count})</span>
                  <span style={{ 
                    transform: tableCollapsed ? "rotate(-90deg)" : "rotate(90deg)", 
                    transition: "transform 0.2s ease",
                    fontSize: 12,
                  }}>
                    ▼
                  </span>
                </div>

                {!tableCollapsed && (
                  <div className="nice-scroll" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                    <DataTable
                      earthquakes={filteredEarthquakes}
                      selectedEarthquake={selected}
                      onSelect={handleSelect}
                      style={{ height: "100%" }}
                    />
                  </div>
                )}
              </div>

              {/* Selected Details */}
              {selected && (
                <div className="card" style={{ padding: 12, flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, opacity: 0.8 }}>
                    📍 Selected Event
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    {selected.place}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12 }}>
                    <div><span style={{ opacity: 0.7 }}>Magnitude:</span> <strong>{selected.magnitude.toFixed(1)}</strong></div>
                    <div><span style={{ opacity: 0.7 }}>Depth:</span> <strong>{selected.depth.toFixed(1)} km</strong></div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ opacity: 0.7 }}>Time:</span> <strong>{new Date(selected.time).toLocaleString()}</strong>
                    </div>
                    <div style={{ gridColumn: "1 / -1", fontSize: 11, opacity: 0.6 }}>
                      {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Globe Modal */}
      {showGlobeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "opacity",
          }}
          onClick={() => setShowGlobeModal(false)}
        >
          <div
            style={{
              width: "95vw",
              height: "95vh",
              background: "linear-gradient(135deg, rgba(15,20,35,0.98) 0%, rgba(30,41,59,0.98) 100%)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: 16,
              boxShadow: "0 25px 80px rgba(0,0,0,0.7), 0 0 40px rgba(139, 92, 246, 0.2)",
              position: "relative",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              animation: "modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), glow 3s ease-in-out infinite",
              willChange: "transform, opacity, box-shadow",
              transform: "translateZ(0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
              flexShrink: 0,
              pointerEvents: "auto",
              zIndex: 200,
              animation: "fadeInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards",
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12,
              }}>
                <div style={{
                  background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15))",
                  padding: 8,
                  borderRadius: 10,
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                  animation: "pulse 3s ease-in-out infinite",
                }}>
                  <svg width="32" height="32" viewBox="0 0 200 200" fill="none">
                    <rect x="60" y="50" width="15" height="100" fill="url(#mLetterGrad)" rx="3"/>
                    <rect x="60" y="50" width="70" height="15" fill="url(#mLetterGrad)" rx="3"/>
                    <rect x="60" y="92.5" width="60" height="15" fill="url(#mLetterGrad)" rx="3"/>
                    <rect x="60" y="135" width="70" height="15" fill="url(#mLetterGrad)" rx="3"/>
                    <path d="M 140 70 L 155 85 L 145 100 L 160 115 L 150 130" 
                          stroke="url(#mAccentGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="mLetterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4"/>
                        <stop offset="50%" stopColor="#8b5cf6"/>
                        <stop offset="100%" stopColor="#ec4899"/>
                      </linearGradient>
                      <linearGradient id="mAccentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24"/>
                        <stop offset="100%" stopColor="#ef4444"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    Globe View
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                    Interactive 3D earthquake visualization
                  </div>
                </div>
              </div>
              <button 
                className="btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowGlobeModal(false);
                }} 
                style={{ fontSize: 13, cursor: "pointer", pointerEvents: "auto" }}
              >
                ✕ Close
              </button>
            </div>
            
            <div style={{ 
              flex: 1, 
              minHeight: 0, 
              width: "100%", 
              position: "relative",
              animation: "fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards",
            }}>
              <GlobePanel
                pointsData={modalPoints}
                altitudeField="altitude"
                onPointClick={(p: GlobePoint) => {
                  const eq = filteredEarthquakes.find((e) => e.id === p.id);
                  if (eq) {
                    setSelected(eq);
                    setToast({
                      title: "📍 Selected Event",
                      lines: [
                        eq.place,
                        `Magnitude: ${eq.magnitude.toFixed(1)}`,
                        `Depth: ${eq.depth.toFixed(1)} km`,
                        `Time: ${new Date(eq.time).toLocaleString()}`,
                        `${eq.lat.toFixed(3)}, ${eq.lng.toFixed(3)}`,
                      ],
                    });
                    setTimeout(() => setToast(null), 4000);
                  }
                }}
                height="100%"
                enableZoom={true}
                pointRadius={modalPointScale}
              />
              
              {/* Floating Controls Bar */}
              <div
                className="card"
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, rgba(15,20,35,0.95), rgba(30,41,59,0.95))",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.2)",
                  zIndex: 100,
                  pointerEvents: "auto",
                  animation: "fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s backwards",
                  willChange: "transform",
                }}
              >
                <label style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#06b6d4" }}>Color by:</span>
                  <select
                    value={colorBy}
                    onChange={(e) => setColorBy(e.target.value as "magnitude" | "depth" | "nst" | "gap")}
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
                    <option value="magnitude" style={{ background: "#1e293b", color: "#fff" }}>Magnitude</option>
                    <option value="depth" style={{ background: "#1e293b", color: "#fff" }}>Depth (km)</option>
                    <option value="nst" style={{ background: "#1e293b", color: "#fff" }}>Station Count</option>
                    <option value="gap" style={{ background: "#1e293b", color: "#fff" }}>Azimuthal Gap</option>
                  </select>
                </label>
                <label style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#ec4899" }}>Point size:</span>
                  <strong style={{ 
                    background: "linear-gradient(135deg, #ec4899, #f97316)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    minWidth: 40,
                    textAlign: "center",
                  }}>
                    {modalPointScale.toFixed(2)}
                  </strong>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={modalPointScale}
                    onChange={(e) => setModalPointScale(parseFloat(e.target.value))}
                    style={{ 
                      marginLeft: 8, 
                      width: 140,
                      accentColor: "#ec4899",
                    }}
                  />
                </label>
              </div>
            </div>
            {/* Toast notification */}
            {toast && (
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  bottom: 80,
                  background: "rgba(20,25,40,0.95)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  minWidth: 280,
                  animation: "toastIn 0.25s ease-out",
                  zIndex: 200,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, opacity: 0.8 }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {toast.lines[0]}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9, display: "grid", gap: 4 }}>
                  {toast.lines.slice(1).map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes modalSlideIn {
                from {
                  opacity: 0;
                  transform: scale(0.9) translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
              @keyframes toastIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default App;
