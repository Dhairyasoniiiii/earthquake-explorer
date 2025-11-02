import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";

export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  altitude?: number;
  color?: string;
  label?: string;
  [key: string]: any;
}

interface GlobePanelProps {
  pointsData: GlobePoint[];
  height?: number | string;
  onPointClick?: (p: GlobePoint) => void;
  altitudeField?: string;
}

export const GlobePanel: React.FC<GlobePanelProps> = ({
  pointsData,
  onPointClick,
  altitudeField = "altitude",
  height = 400,
}) => {
  const globeRef = useRef<any>(null);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.controls().autoRotate = false;
  }, [pointsData]);

  const maxAltitude =
    Math.max(...pointsData.map((p) => p[altitudeField] || 1), 1) || 1;

  return (
    <div style={{ height }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        pointsData={pointsData}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lng}
        pointAltitude={(d: any) => {
          const val = d[altitudeField];
          if (typeof val !== "number" || isNaN(val)) return 0.01;
          return Math.min(0.15, Math.max(0.01, (val / maxAltitude) * 0.15));
        }}
        pointColor={(d: any) => d.color || "orange"}
        pointRadius={0.4}
        onPointClick={(d: any) => onPointClick?.(d as GlobePoint)}
      />
    </div>
  );
};
