import React, { memo, useEffect, useRef } from "react";
import { animate } from "animejs";
import { gsap } from "gsap";
import type { Earthquake } from "../types";

interface ParticleEarthProps { events: Earthquake[]; onSelect: (id: string) => void; onIntroComplete: () => void }
interface Particle { x: number; y: number; z: number; fromX: number; fromY: number; fromZ: number; land: boolean; size: number }
interface ProjectedEvent { id: string; x: number; y: number; radius: number; depth: number; magnitude: number }

const PARTICLE_COUNT = 400;
const TAU = Math.PI * 2;
const FRAME_INTERVAL_MS = 1000 / 60;

// A deliberately light canvas globe: no texture downloads, WebGL scene, or per-frame React work.
const ParticleEarthComponent: React.FC<ParticleEarthProps> = ({ events, onSelect, onIntroComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<((timestamp: number) => void) | null>(null);
  const eventsRef = useRef(events);
  const selectRef = useRef(onSelect);
  const completeRef = useRef(onIntroComplete);
  const zoomRef = useRef<(factor: number) => void>(() => {});
  eventsRef.current = events;
  selectRef.current = onSelect;
  completeRef.current = onIntroComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!canvas || !context) return;
    const ctx = context;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let rotation = -0.32;
    let tilt = .22;
    let zoom = 1;
    let currentRadius = 0;
    let lastFrame = 0;
    let activePointer: number | null = null;
    let pointerMoved = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let introReported = false;
    let projectedEvents: ProjectedEvent[] = [];
    const morph = { progress: reducedMotion ? 1 : 0 };
    let morphAnimation: ReturnType<typeof animate> | null = null;
    let seed = 48271;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const y = 1 - (index / (PARTICLE_COUNT - 1)) * 2;
      const ring = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * index;
      const x = Math.cos(theta) * ring;
      const z = Math.sin(theta) * ring;
      const lat = Math.asin(y) * 180 / Math.PI;
      const lon = Math.atan2(z, x) * 180 / Math.PI;
      const land = isLand(lat, lon);
      const spread = 1.35 + random() * 1.2;
      return { x, y, z, fromX: (random() - .5) * spread * 2.2, fromY: (random() - .5) * spread * 1.6, fromZ: (random() - .5) * .7, land, size: .55 + random() * 1.05 };
    });

    function resize() {
      const bounds = canvas!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reducedMotion) drawRef.current?.(performance.now());
    }

    function draw(timestamp: number) {
      if (document.hidden) { frame = 0; return; }
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
      if (timestamp - lastFrame < FRAME_INTERVAL_MS) return;
      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 100) : FRAME_INTERVAL_MS;
      lastFrame = timestamp;
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      const radius = Math.min(width * .295, height * .39, 290) * zoom;
      currentRadius = radius;
      const cx = width * .55;
      const cy = height * .52;
      const progress = morph.progress;
      if (progress >= 1 && !reducedMotion) rotation += elapsed * .00005625;
      if (progress >= 1 && !introReported) {
        introReported = true;
        completeRef.current();
      }

      // Soft atmosphere and the restrained orbit frame.
      const atmosphere = ctx.createRadialGradient(cx, cy, radius * .75, cx, cy, radius * 1.45);
      atmosphere.addColorStop(0, "rgba(66, 218, 207, .11)");
      atmosphere.addColorStop(.48, "rgba(63, 138, 196, .075)");
      atmosphere.addColorStop(1, "rgba(45, 109, 173, 0)");
      ctx.fillStyle = atmosphere;
      ctx.beginPath(); ctx.arc(cx, cy, radius * 1.45, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, cy, radius * 1.37, radius * .39, -.16, 0, TAU);
      ctx.strokeStyle = "rgba(124, 224, 232, .13)"; ctx.lineWidth = 1; ctx.stroke();

      const c = Math.cos(rotation);
      const s = Math.sin(rotation);
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      for (const particle of particles) {
        const x = particle.fromX + (particle.x - particle.fromX) * progress;
        const y = particle.fromY + (particle.y - particle.fromY) * progress;
        const z = particle.fromZ + (particle.z - particle.fromZ) * progress;
        const rx = x * c - z * s;
        const rz = x * s + z * c;
        const ry = y * ct - rz * st;
        const depth = y * st + rz * ct;
        if (depth > -.28 || progress < 1) {
        const arrival = Math.max(.18, Math.min(1, (progress - .14) * 2.4 + .35));
        const perspective = .76 + (depth + 1) * .17;
        ctx.globalAlpha = arrival * (.38 + Math.max(0, depth) * .5);
        ctx.fillStyle = particle.land ? "#a4f4df" : depth > .15 ? "#70cbd7" : "#4c90bd";
        ctx.beginPath(); ctx.arc(cx + rx * radius, cy - ry * radius, particle.size * perspective, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      const liveEvents = eventsRef.current.slice(0, 80);
      projectedEvents = [];
      for (const event of liveEvents) {
        const lat = event.lat * Math.PI / 180;
        const lon = event.lng * Math.PI / 180 + rotation;
        const x = Math.cos(lat) * Math.sin(lon);
        const y = Math.sin(lat);
        const z = Math.cos(lat) * Math.cos(lon);
        const ry = y * ct - z * st;
        const depth = y * st + z * ct;
        if (depth < -.08) continue;
        const px = cx + x * radius;
        const py = cy - ry * radius;
        const markerRadius = 1.7 + Math.min(event.magnitude, 7) * .38;
        projectedEvents.push({ id: event.id, x: px, y: py, radius: markerRadius, depth, magnitude: event.magnitude });
        ctx.globalAlpha = .35 + depth * .45;
        ctx.fillStyle = event.magnitude >= 5 ? "#ff977c" : "#ffe3a0";
        ctx.beginPath(); ctx.arc(px, py, markerRadius * (1.2 + Math.sin(timestamp / 620 + event.time) * .12), 0, TAU); ctx.fill();
        ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.arc(px, py, Math.max(1.1, markerRadius * .35), 0, TAU); ctx.fillStyle = "#fff3d7"; ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Fine outer edge gives the dotted surface a planetary silhouette.
      const edge = ctx.createRadialGradient(cx - radius * .24, cy - radius * .28, radius * .15, cx, cy, radius * 1.03);
      edge.addColorStop(.9, "rgba(103, 217, 208, .02)"); edge.addColorStop(1, "rgba(130, 237, 232, .34)");
      ctx.strokeStyle = edge; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.stroke();
    }

    function selectAt(clientX: number, clientY: number) {
      const bounds = canvas!.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      let nearest: ProjectedEvent | undefined;
      let distance = Math.max(12, 15 * zoom);
      for (const point of projectedEvents) {
        const candidate = Math.hypot(point.x - x, point.y - y);
        if (candidate < distance) { nearest = point; distance = candidate; }
      }
      if (nearest) selectRef.current(nearest.id);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      activePointer = event.pointerId;
      pointerMoved = false;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      canvas!.setPointerCapture(event.pointerId);
      canvas!.style.cursor = "grabbing";
    }

    function handlePointerMove(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      if (Math.abs(dx) + Math.abs(dy) > 2) pointerMoved = true;
      if (pointerMoved && currentRadius > 0) {
        rotation += dx / currentRadius;
        tilt = Math.max(-1.1, Math.min(1.1, tilt + dy / currentRadius));
        if (reducedMotion) draw(performance.now());
      }
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    }

    function handlePointerUp(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;
      if (!pointerMoved) selectAt(event.clientX, event.clientY);
      activePointer = null;
      canvas!.style.cursor = "grab";
      if (canvas!.hasPointerCapture(event.pointerId)) canvas!.releasePointerCapture(event.pointerId);
    }

    function handlePointerCancel(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;
      activePointer = null;
      canvas!.style.cursor = "grab";
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      zoomBy(Math.exp(-event.deltaY * .001));
    }

    function zoomBy(factor: number) {
      zoom = Math.max(.72, Math.min(2.15, zoom * factor));
      if (reducedMotion) draw(performance.now());
    }

    function handleKeyDown(event: KeyboardEvent) {
      const step = event.shiftKey ? .28 : .12;
      if (event.key === "ArrowLeft") rotation -= step;
      else if (event.key === "ArrowRight") rotation += step;
      else if (event.key === "ArrowUp") tilt = Math.max(-1.1, tilt - step);
      else if (event.key === "ArrowDown") tilt = Math.min(1.1, tilt + step);
      else if (event.key === "+" || event.key === "=") zoom = Math.min(2.15, zoom * 1.15);
      else if (event.key === "-") zoom = Math.max(.72, zoom / 1.15);
      else return;
      event.preventDefault();
      if (reducedMotion) draw(performance.now());
    }

    drawRef.current = draw;
    zoomRef.current = zoomBy;

    function handleVisibilityChange() {
      if (!document.hidden && !frame) frame = window.requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("keydown", handleKeyDown);
    resize();
    const intro = gsap.timeline({ onComplete: () => {
      if (!reducedMotion) {
        morphAnimation = animate(morph, {
          progress: 1,
          duration: 3_200,
          ease: "out(3)",
          onUpdate: () => { if (!document.hidden && !frame) frame = window.requestAnimationFrame(draw); },
        });
      }
    } });
    intro.fromTo(canvas, { opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : .88 }, { opacity: 1, scale: 1, duration: reducedMotion ? 0 : 1.1, ease: "power3.out" });
    frame = window.requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      intro.kill();
      morphAnimation?.pause();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      drawRef.current = null;
      zoomRef.current = () => {};
    };
  }, []);

  useEffect(() => { drawRef.current?.(performance.now()); }, [events]);

  return <>
    <canvas className="particle-earth" ref={canvasRef} tabIndex={0} role="application" aria-label="Interactive particle globe. Drag to rotate, scroll to zoom, use arrow keys to rotate and plus or minus to zoom, and select an earthquake marker for details."/>
    <div className="globe-zoom-controls" role="group" aria-label="Globe zoom controls">
      <button type="button" onClick={() => zoomRef.current(1.25)} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => zoomRef.current(.8)} aria-label="Zoom out">−</button>
    </div>
  </>;
};

function isLand(lat: number, lon: number) {
  const regions: Array<[number, number, number, number]> = [
    [7, 82, -168, -52], [-56, 13, -82, -34], [35, 72, -12, 52], [-35, 37, -18, 52],
    [5, 78, 35, 178], [-11, 22, 95, 155], [50, 72, -168, -128], [-78, -60, -68, -40],
    [10, 31, 42, 63], [22, 40, 115, 132], [-6, 7, 100, 120],
  ];
  return regions.some(([south, north, west, east]) => lat >= south && lat <= north && lon >= west && lon <= east);
}

export const ParticleEarth = memo(ParticleEarthComponent);
