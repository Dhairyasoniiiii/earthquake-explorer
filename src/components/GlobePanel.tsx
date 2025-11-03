import React, { useRef, useEffect, memo } from "react";
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
  enableZoom?: boolean;
  pointRadius?: number;
}

const GlobePanelComponent: React.FC<GlobePanelProps> = ({
  pointsData,
  onPointClick,
  altitudeField = "altitude",
  height = 400,
  enableZoom = true,
  pointRadius = 0.3,
}) => {
  const globeRef = useRef<any>(null);
  const maxAltitudeRef = useRef<number>(1);

  // Memoize max altitude calculation
  useEffect(() => {
    const newMax = Math.max(...pointsData.map((p) => p[altitudeField] || 1), 1) || 1;
    maxAltitudeRef.current = newMax;
  }, [pointsData, altitudeField]);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    // Inline: rotate slowly, no zoom/pan; Modal: user can zoom/pan
    controls.autoRotate = !enableZoom;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    controls.enableZoom = enableZoom;
    controls.enablePan = enableZoom;
    controls.minPolarAngle = 0; // Allow full vertical rotation
    controls.maxPolarAngle = Math.PI; // Allow full vertical rotation

    // Set initial view to fit full globe comfortably
    try {
      const altitude = enableZoom ? 2.4 : 5.0; // 70% smaller total (30% + 20% + 20% more)
      globeRef.current.pointOfView({ altitude, lat: 0, lng: 0 }, 0);
    } catch {}
  }, [enableZoom]);

  return (
    <div style={{ 
      height, 
      width: "100%",
      position: "relative", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Globe
        ref={globeRef}
        width={typeof height === "number" ? height : undefined}
        height={typeof height === "number" ? height : undefined}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}
        pointsData={pointsData}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lng}
        pointAltitude={(d: any) => {
          const val = d[altitudeField];
          if (typeof val !== "number" || isNaN(val)) return 0.01;
          return Math.min(0.15, Math.max(0.01, (val / maxAltitudeRef.current) * 0.15));
        }}
        pointColor={(d: any) => d.color || "orange"}
        pointRadius={pointRadius}
        onPointClick={(d: any) => onPointClick?.(d as GlobePoint)}
      />
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const GlobePanel = memo(GlobePanelComponent, (prevProps, nextProps) => {
  // Only re-render if these props actually changed
  return (
    prevProps.pointsData.length === nextProps.pointsData.length &&
    prevProps.altitudeField === nextProps.altitudeField &&
    prevProps.enableZoom === nextProps.enableZoom &&
    prevProps.pointRadius === nextProps.pointRadius &&
    prevProps.height === nextProps.height
  );
});

