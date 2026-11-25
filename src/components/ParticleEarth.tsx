import React, { memo, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Earthquake } from "../types";

interface ParticleEarthProps {
  events: Earthquake[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onIntroComplete: () => void;
}

const EARTH_RADIUS = 2;
const PARTICLE_COLUMNS = 128;
const PARTICLE_ROWS = 64;
const INTRO_DURATION_MS = 3_400;

const particleVertexShader = `
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uProgress;
  uniform float uTime;
  uniform float uFade;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float scatter = 1.0 - uProgress;
    vec3 position = mix(aStart, aTarget, uProgress);
    position += vec3(
      sin(uTime * 1.4 + aPhase),
      cos(uTime * 1.15 + aPhase * 1.7),
      sin(uTime * 1.8 + aPhase * 0.7)
    ) * (0.11 * scatter);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * (210.0 / -viewPosition.z), 1.0, 5.5);
    vColor = aColor;
    vAlpha = uFade;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.16, 0.5, distanceFromCenter);
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor, alpha * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const markerVertexShader = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSelected;
  uniform float uTime;
  varying vec3 vColor;
  varying float vSelected;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * (235.0 / -viewPosition.z), 2.0, 13.0);
    vColor = aColor;
    vSelected = aSelected;
  }
`;

const markerFragmentShader = `
  uniform float uTime;
  varying vec3 vColor;
  varying float vSelected;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float core = 1.0 - smoothstep(0.08, 0.24, d);
    float halo = (1.0 - smoothstep(0.18, 0.5, d)) * 0.52;
    float pulseRadius = 0.28 + 0.025 * sin(uTime * 3.0);
    float ring = (1.0 - smoothstep(0.025, 0.075, abs(d - pulseRadius))) * vSelected;
    float alpha = max(core, max(halo, ring));
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.4);
    gl_FragColor = vec4(0.23, 0.68, 0.72, rim * 0.5);
  }
`;

function geographicPosition(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((lng + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function createStars(): THREE.Points {
  const count = 1_650;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const z = Math.random() * 2 - 1;
    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 22;
    const ring = Math.sqrt(1 - z * z) * radius;
    positions[index * 3] = Math.cos(angle) * ring;
    positions[index * 3 + 1] = z * radius;
    positions[index * 3 + 2] = Math.sin(angle) * ring;
    sizes[index] = Math.random() < 0.06 ? 0.065 : 0.028 + Math.random() * 0.025;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({
    color: 0xc9d6b5,
    size: 0.045,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function createGraticule(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0xd6e9cb, transparent: true, opacity: 0.12, depthWrite: false });
  for (let lat = -60; lat <= 60; lat += 30) {
    const points: THREE.Vector3[] = [];
    for (let lng = -180; lng <= 180; lng += 3) points.push(geographicPosition(lat, lng, EARTH_RADIUS + 0.006));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }
  for (let lng = -150; lng <= 180; lng += 30) {
    const points: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 3) points.push(geographicPosition(lat, lng, EARTH_RADIUS + 0.006));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }
  return group;
}

function createParticlePoints(image: HTMLImageElement | HTMLCanvasElement): THREE.Points {
  const sampleWidth = 256;
  const sampleHeight = 128;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) throw new Error("Could not sample Earth texture for the particle transition");
  sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const count = PARTICLE_COLUMNS * PARTICLE_ROWS;
  const starts = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const column = index % PARTICLE_COLUMNS;
    const row = Math.floor(index / PARTICLE_COLUMNS);
    const u = (column + 0.5) / PARTICLE_COLUMNS;
    const v = (row + 0.5) / PARTICLE_ROWS;
    const px = Math.min(sampleWidth - 1, Math.floor(u * sampleWidth));
    const py = Math.min(sampleHeight - 1, Math.floor((1 - v) * sampleHeight));
    const pixel = (py * sampleWidth + px) * 4;
    const target = geographicPosition((0.5 - v) * 180, u * 360 - 180, EARTH_RADIUS + 0.025);
    const offset = index * 3;
    const phase = Math.random() * Math.PI * 2;
    starts[offset] = (u - 0.5) * 6.1 + Math.cos(phase * 1.7) * 0.1;
    starts[offset + 1] = (0.5 - v) * 3.05 + Math.sin(phase * 1.3) * 0.1;
    starts[offset + 2] = Math.sin(phase) * (0.18 + Math.random() * 0.42);
    targets[offset] = target.x;
    targets[offset + 1] = target.y;
    targets[offset + 2] = target.z;
    color.setRGB(pixels[pixel] / 255, pixels[pixel + 1] / 255, pixels[pixel + 2] / 255, THREE.SRGBColorSpace);
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
    sizes[index] = 0.055 + Math.random() * 0.045;
    phases[index] = phase;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("aStart", new THREE.BufferAttribute(starts, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 } },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  particles.renderOrder = 3;
  return particles;
}

const ParticleEarthComponent: React.FC<ParticleEarthProps> = ({ events, selectedId, onSelect, onIntroComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventsRef = useRef(events);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const completeRef = useRef(onIntroComplete);
  const zoomRef = useRef<(factor: number) => void>(() => {});
  const updateMarkersRef = useRef<(nextEvents: Earthquake[], nextSelectedId: string | null) => void>(() => {});
  eventsRef.current = events;
  selectRef.current = onSelect;
  selectedRef.current = selectedId;
  completeRef.current = onIntroComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch (error) {
      console.error("WebGL globe could not start", error);
      completeRef.current();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(0, 0, 6.5);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 3.3;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.24;
    controls.target.set(0, 0, 0);
    controls.listenToKeyEvents(window);

    const stars = createStars();
    scene.add(stars);
    const earthGroup = new THREE.Group();
    earthGroup.rotation.y = -0.12;
    earthGroup.rotation.x = 0.04;
    scene.add(earthGroup);

    scene.add(new THREE.HemisphereLight(0xb9d6d4, 0x14201b, 1.35));
    const keyLight = new THREE.DirectionalLight(0xfff4dc, 2.35);
    keyLight.position.set(-4.2, 2.8, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x53b4bf, 1.1);
    rimLight.position.set(4.5, -1.5, -4);
    scene.add(rimLight);

    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 112, 72);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.035, 80, 48),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    earthGroup.add(atmosphere);
    earthGroup.add(createGraticule());

    const markerGeometry = new THREE.BufferGeometry();
    const markerMaterial = new THREE.ShaderMaterial({
      vertexShader: markerVertexShader,
      fragmentShader: markerFragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    const markers = new THREE.Points(markerGeometry, markerMaterial);
    markers.frustumCulled = false;
    markers.renderOrder = 4;
    earthGroup.add(markers);

    let particles: THREE.Points | null = null;
    let earthTexture: THREE.Texture | null = null;
    let frame = 0;
    let startTime = 0;
    let introFinished = false;
    let width = 0;
    let height = 0;
    let pointerDown: { x: number; y: number } | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points!.threshold = 0.095;
    const pointer = new THREE.Vector2();

    updateMarkersRef.current = (nextEvents, nextSelectedId) => {
      const positions = new Float32Array(nextEvents.length * 3);
      const colors = new Float32Array(nextEvents.length * 3);
      const sizes = new Float32Array(nextEvents.length);
      const selected = new Float32Array(nextEvents.length);
      const markerColor = new THREE.Color();
      nextEvents.forEach((event, index) => {
        const point = geographicPosition(event.lat, event.lng, EARTH_RADIUS + 0.028);
        const offset = index * 3;
        positions[offset] = point.x;
        positions[offset + 1] = point.y;
        positions[offset + 2] = point.z;
        const mag = Math.max(0, event.magnitude);
        const isSelected = event.id === nextSelectedId;
        markerColor.set(isSelected ? 0xf6f2c6 : mag >= 5 ? 0xff785d : mag >= 3 ? 0xffad68 : 0xf4d49a);
        colors[offset] = markerColor.r;
        colors[offset + 1] = markerColor.g;
        colors[offset + 2] = markerColor.b;
        sizes[index] = 0.048 + Math.min(mag, 7) * 0.012 + (isSelected ? 0.02 : 0);
        selected[index] = isSelected ? 1 : 0;
      });
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aSelected", new THREE.BufferAttribute(selected, 1));
      markers.geometry.dispose();
      markers.geometry = geometry;
    };
    updateMarkersRef.current(eventsRef.current, selectedRef.current);

    const resize = () => {
      const bounds = canvas!.parentElement?.getBoundingClientRect();
      if (!bounds) return;
      width = Math.max(bounds.width, 1);
      height = Math.max(bounds.height, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const finishIntro = () => {
      if (introFinished) return;
      introFinished = true;
      if (particles) {
        particles.visible = false;
        (particles.material as THREE.ShaderMaterial).uniforms.uFade.value = 0;
      }
      completeRef.current();
    };

    const startParticleIntro = (image: HTMLImageElement | HTMLCanvasElement | undefined) => {
      if (image) {
        try {
          particles = createParticlePoints(image);
          earthGroup.add(particles);
        } catch (error) {
          console.warn("Particle transition unavailable; showing textured Earth directly", error);
        }
      }
      startTime = performance.now();
      if (reducedMotion) {
        earthMaterial.opacity = 1;
        finishIntro();
      }
    };

    const loader = new THREE.TextureLoader();
    const useEarthTexture = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
      startParticleIntro(texture.image as HTMLImageElement);
    };
    earthTexture = loader.load(
      "/earth_atmos_2048.jpg",
      useEarthTexture,
      undefined,
      (error) => {
        console.warn("Local Earth texture unavailable; loading the hosted Earth map", error);
        earthTexture = loader.load(
          "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
          useEarthTexture,
          undefined,
          (fallbackError) => {
            console.error("Earth texture failed to load", fallbackError);
            earthMaterial.color.set(0x345b5c);
            earthMaterial.opacity = 1;
            earthMaterial.depthWrite = true;
            startParticleIntro(undefined);
          },
        );
      },
    );

    function handlePointerDown(event: PointerEvent) {
      if (event.button === 0) pointerDown = { x: event.clientX, y: event.clientY };
    }

    function handlePointerUp(event: PointerEvent) {
      if (!pointerDown) return;
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      pointerDown = null;
      if (moved > 5 || !width || !height) return;
      const bounds = canvas!.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      const markerHit = raycaster.intersectObject(markers, false)[0];
      if (!markerHit || markerHit.index === undefined) return;
      const earthHit = raycaster.intersectObject(earth, false)[0];
      if (earthHit && markerHit.distance > earthHit.distance + 0.07) return;
      const eventAtPoint = eventsRef.current[markerHit.index];
      if (eventAtPoint) selectRef.current(eventAtPoint.id);
    }

    function zoomBy(factor: number) {
      camera.position.multiplyScalar(factor);
      camera.position.clampLength(controls.minDistance, controls.maxDistance);
      controls.update();
    }
    zoomRef.current = zoomBy;
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    resize();

    let previousTime = 0;
    const render = (time: number) => {
      frame = window.requestAnimationFrame(render);
      const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
      previousTime = time;
      controls.update();
      stars.rotation.y += delta * 0.006;
      const elapsed = startTime ? Math.max(0, time - startTime) : 0;
      const rawProgress = reducedMotion ? 1 : Math.min(elapsed / INTRO_DURATION_MS, 1);
      const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
      if (particles) {
        const material = particles.material as THREE.ShaderMaterial;
        material.uniforms.uProgress.value = progress;
        material.uniforms.uTime.value = time / 1000;
        material.uniforms.uFade.value = 1 - Math.max(0, Math.min(1, (rawProgress - 0.7) / 0.3));
        earthMaterial.opacity = Math.max(0, Math.min(1, (rawProgress - 0.46) / 0.48));
        earthMaterial.depthWrite = rawProgress >= 0.97;
        if (rawProgress >= 1) finishIntro();
      } else if (startTime) {
        earthMaterial.opacity = 1;
        earthMaterial.depthWrite = true;
        if (rawProgress >= 1) finishIntro();
      }
      markerMaterial.uniforms.uTime.value = time / 1000;
      renderer.render(scene, camera);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      markers.geometry.dispose();
      markerMaterial.dispose();
      earthTexture?.dispose();
      stars.geometry.dispose();
      (stars.material as THREE.Material).dispose();
      earthGroup.traverse((object) => {
        if (object instanceof THREE.Line) object.geometry.dispose();
        if (object instanceof THREE.Mesh && object !== earth && object !== atmosphere) object.geometry.dispose();
        if (object === atmosphere) {
          (object as THREE.Mesh).geometry.dispose();
          ((object as THREE.Mesh).material as THREE.Material).dispose();
        }
      });
      if (particles) {
        particles.geometry.dispose();
        (particles.material as THREE.Material).dispose();
      }
      updateMarkersRef.current = () => {};
      zoomRef.current = () => {};
    };
  }, []);

  useEffect(() => { updateMarkersRef.current(events, selectedId); }, [events, selectedId]);

  return <>
    <canvas className="particle-earth" ref={canvasRef} tabIndex={0} role="application" aria-label="Interactive textured Earth globe. Drag to rotate, scroll to zoom, use arrow keys to orbit, and select a glowing earthquake marker for its exact location and details." />
    <div className="globe-zoom-controls" role="group" aria-label="Globe zoom controls">
      <button type="button" onClick={() => zoomRef.current(0.82)} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => zoomRef.current(1.22)} aria-label="Zoom out">−</button>
    </div>
  </>;
};

export const ParticleEarth = memo(ParticleEarthComponent);

