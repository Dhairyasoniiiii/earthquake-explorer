import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  altitude?: number;
  color?: string;
  label?: string;
}

interface GlobePanelProps {
  pointsData: GlobePoint[];
  height?: number | string;
  onPointClick?: (point: GlobePoint) => void;
  altitudeField?: string;
  enableZoom?: boolean;
  pointRadius?: number;
}

const GlobePanelComponent: React.FC<GlobePanelProps> = ({
  pointsData, onPointClick, altitudeField = "altitude", height = "100%", enableZoom = true, pointRadius = 0.24,
}) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const maxAltitude = useMemo(() => pointsData.reduce((max, point) => {
    const value = point[altitudeField as keyof GlobePoint];
    return typeof value === "number" && Number.isFinite(value) ? Math.max(max, Math.abs(value)) : max;
  }, 1), [pointsData, altitudeField]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height: observedHeight } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(observedHeight) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = !enableZoom;
    controls.autoRotateSpeed = 0.3;
    controls.enableDamping = true;
    controls.enableZoom = enableZoom;
    controls.enablePan = enableZoom;
    if (!globeRef.current.pointOfView) return;
    globeRef.current.pointOfView({ altitude: enableZoom ? 2.2 : 2.5, lat: 12, lng: 0 }, 500);
  }, [enableZoom, size.width, size.height]);

  return <div className="globe-canvas" ref={containerRef} style={{ height, width: "100%" }}>
    {size.width > 0 && size.height > 0 && <Globe
      ref={globeRef}
      width={size.width}
      height={size.height}
      globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundColor="rgba(0,0,0,0)"
      showAtmosphere
      atmosphereColor="#67d9d0"
      atmosphereAltitude={0.12}
      pointsData={pointsData}
      pointLat={(raw: object) => (raw as GlobePoint).lat}
      pointLng={(raw: object) => (raw as GlobePoint).lng}
      pointAltitude={(raw: object) => {
        const point = raw as GlobePoint;
        const value = point[altitudeField as keyof GlobePoint];
        if (typeof value !== "number" || !Number.isFinite(value)) return 0.01;
        return Math.max(0.008, Math.min(0.12, Math.abs(value / maxAltitude) * 0.12));
      }}
      pointColor={(raw: object) => (raw as GlobePoint).color ?? "#67d9d0"}
      pointRadius={pointRadius}
      pointResolution={4}
      pointsTransitionDuration={0}
      pointLabel={(raw: object) => (raw as GlobePoint).label ?? "Earthquake"}
      onPointClick={(raw: object) => onPointClick?.(raw as GlobePoint)}
    />}
  </div>;
};

export const GlobePanel = memo(GlobePanelComponent);

