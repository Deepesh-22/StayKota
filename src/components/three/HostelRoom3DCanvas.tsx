import React, { useEffect, useRef, useState } from 'react';
import { Cuboid, Moon, RotateCcw, Sun } from 'lucide-react';
import { RoomShowcase } from '../hostel/RoomShowcase';
import {
  detectGpuProfile,
  disposeThreeScene,
  hasWebGLSupport,
  loadThree,
} from '../../lib/gpu-budget';
import '../../styles/three-scenes.css';

export type RoomCameraPreset = 'isometric' | 'desk' | 'plan';
export type RoomLightingMode = 'day' | 'night';

export interface HostelRoom3DCanvasProps {
  capacity?: number;
  roomName?: string;
  features?: string[];
  included?: string[];
  height?: number;
  className?: string;
}

const CAMERA_PRESETS: Record<
  RoomCameraPreset,
  { azimuth: number; polar: number; radius: number; label: string }
> = {
  isometric: { azimuth: 0.72, polar: 0.58, radius: 6.35, label: '3D Cutaway' },
  desk: { azimuth: 0.32, polar: 0.72, radius: 5.15, label: 'Study Desk' },
  plan: { azimuth: 0.02, polar: 0.14, radius: 7.1, label: 'Floor Plan' },
};

/**
 * 25 Residences + Heron AI Parametric Three.js 3D Student Room & Floorplan Studio:
 * - Dynamically constructs 1–4 student beds, study desk + glowing lamp, laptop,
 *   bookshelf, wardrobe, split AC unit (when AC included), attached washroom door,
 *   sunlit Kota window, indoor plant & ceiling fan from JSON room specs (0 MB GLBs!).
 * - Live Day / Study Night lighting transition (smooth 60 FPS color & intensity lerp).
 * - One-click camera presets (`3D Cutaway`, `Study Desk`, `Floor Plan` top-down view)
 *   + horizontal/vertical drag-to-orbit inertia + clean WebGL disposal + SVG fallback.
 */
export function HostelRoom3DCanvas({
  capacity = 2,
  roomName,
  features = [],
  included = [],
  height = 300,
  className = '',
}: HostelRoom3DCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [lightingMode, setLightingMode] = useState<RoomLightingMode>('day');
  const [preset, setPreset] = useState<RoomCameraPreset>('isometric');
  const [dragging, setDragging] = useState(false);

  const hasAC = [...features, ...included].some((item) => /\bac\b|air/i.test(item));
  const hasAttachedBath = features.some((item) => /attached/i.test(item));

  const orbitRef = useRef({
    targetAzimuth: CAMERA_PRESETS.isometric.azimuth,
    azimuth: CAMERA_PRESETS.isometric.azimuth,
    targetPolar: CAMERA_PRESETS.isometric.polar,
    polar: CAMERA_PRESETS.isometric.polar,
    targetRadius: CAMERA_PRESETS.isometric.radius,
    radius: CAMERA_PRESETS.isometric.radius,
    autoSway: true,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const lightingRef = useRef<RoomLightingMode>(lightingMode);
  lightingRef.current = lightingMode;

  const applyPreset = (nextPreset: RoomCameraPreset) => {
    setPreset(nextPreset);
    const cfg = CAMERA_PRESETS[nextPreset];
    orbitRef.current.targetAzimuth = cfg.azimuth;
    orbitRef.current.targetPolar = cfg.polar;
    orbitRef.current.targetRadius = cfg.radius;
    orbitRef.current.autoSway = nextPreset === 'isometric';
  };

  const resetCamera = () => {
    applyPreset('isometric');
    setLightingMode('day');
  };

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let visible = true;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let cleanupThree: (() => void) | null = null;

    const el = hostRef.current;
    if (!el) return;

    const profile = detectGpuProfile();

    (async () => {
      try {
        if (!hasWebGLSupport()) {
          if (!cancelled) setWebglReady(false);
          return;
        }

        const THREE = await loadThree();
        if (cancelled || !hostRef.current) return;

        const renderer = new THREE.WebGLRenderer({
          antialias: profile.antialias,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(profile.dpr);
        renderer.shadowMap.enabled = profile.shadows;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const target = hostRef.current;
        target.innerHTML = '';
        target.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);

        // Dynamic Lighting (smoothly interpolated between Morning Sunlight & Night Study Mode)
        const hemiLight = new THREE.HemisphereLight(0xf8fcf9, 0xd4e2d6, 1.35);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xfff4dc, 1.55);
        sunLight.position.set(4.5, 6.8, 4.2);
        sunLight.castShadow = profile.shadows;
        sunLight.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize);
        scene.add(sunLight);

        const deskLampLight = new THREE.PointLight(0xffb74d, 0.85, 4.6, 1.6);
        deskLampLight.position.set(-1.18, 1.34, -1.08);
        scene.add(deskLampLight);

        const roomGroup = new THREE.Group();
        roomGroup.position.y = -0.58;
        scene.add(roomGroup);

        // Architectural Shell Materials
        const matFloor = new THREE.MeshStandardMaterial({ color: 0xe6d7c1, roughness: 0.78 });
        const matWall = new THREE.MeshStandardMaterial({ color: 0xf7f6ef, roughness: 0.86 });
        const matTrim = new THREE.MeshStandardMaterial({ color: 0xd0ded2, roughness: 0.7 });
        const matWood = new THREE.MeshStandardMaterial({ color: 0xc29264, roughness: 0.62 });
        const matDarkWood = new THREE.MeshStandardMaterial({ color: 0x8d6340, roughness: 0.68 });
        const matMattress = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
        const matBlanket = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.62 });
        const matPillow = new THREE.MeshStandardMaterial({ color: 0xe6f4ed, roughness: 0.6 });
        const matSkyGlass = new THREE.MeshStandardMaterial({
          color: 0xbae6fd,
          emissive: 0x7dd3fc,
          emissiveIntensity: 0.35,
          roughness: 0.18,
        });
        const matLampShade = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.65,
          roughness: 0.3,
        });

        // Floor Slab + Back & Left Cutaway Walls
        const floor = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 3.4), matFloor);
        floor.position.y = -0.08;
        floor.receiveShadow = true;
        roomGroup.add(floor);

        const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.25, 0.14), matWall);
        backWall.position.set(0, 1.12, -1.63);
        backWall.receiveShadow = true;
        roomGroup.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.25, 3.4), matWall);
        leftWall.position.set(-1.83, 1.12, 0);
        leftWall.receiveShadow = true;
        roomGroup.add(leftWall);

        // Woven Study Rug
        const rug = new THREE.Mesh(
          new THREE.BoxGeometry(1.75, 0.025, 1.35),
          new THREE.MeshStandardMaterial({ color: 0xdbece2, roughness: 0.92 }),
        );
        rug.position.set(0.05, 0.015, 0.25);
        rug.receiveShadow = true;
        roomGroup.add(rug);

        // Kota Window on Back Wall
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.05, 0.18), matTrim);
        winFrame.position.set(0.15, 1.32, -1.61);
        roomGroup.add(winFrame);

        const winPane = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.88, 0.2), matSkyGlass);
        winPane.position.set(0.15, 1.32, -1.61);
        roomGroup.add(winPane);

        // Parametric Split AC Unit (Heron AI style — rendered when AC feature present or multi-bed)
        if (hasAC) {
          const acBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.92, 0.24, 0.22),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32 }),
          );
          acBody.position.set(0.15, 2.02, -1.48);
          acBody.castShadow = profile.shadows;
          roomGroup.add(acBody);

          const acLed = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.025, 0.02),
            new THREE.MeshStandardMaterial({
              color: 0x34d399,
              emissive: 0x10b981,
              emissiveIntensity: 0.9,
            }),
          );
          acLed.position.set(0.48, 1.98, -1.36);
          roomGroup.add(acLed);
        }

        // Parametric Attached Washroom Door on Left Wall
        if (hasAttachedBath) {
          const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.17, 1.62, 0.76), matTrim);
          doorFrame.position.set(-1.8, 0.81, 0.95);
          roomGroup.add(doorFrame);

          const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.19, 1.52, 0.66), matWood);
          doorPanel.position.set(-1.79, 0.78, 0.95);
          roomGroup.add(doorPanel);
        }

        // Study Desk + Laptop + Warm Study Lamp + Chair (Back-Left Corner)
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 0.58), matWood);
        deskTop.position.set(-1.12, 0.74, -1.22);
        deskTop.castShadow = profile.shadows;
        roomGroup.add(deskTop);

        for (const [lx, lz] of [
          [-1.6, -1.45],
          [-0.64, -1.45],
          [-1.6, -0.98],
          [-0.64, -0.98],
        ]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), matDarkWood);
          leg.position.set(lx, 0.37, lz);
          roomGroup.add(leg);
        }

        // Laptop on study desk
        const laptopBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.02, 0.24),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
        );
        laptopBase.position.set(-1.02, 0.78, -1.18);
        roomGroup.add(laptopBase);

        const laptopScreen = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.22, 0.02),
          new THREE.MeshStandardMaterial({
            color: 0xe0f2fe,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.45,
          }),
        );
        laptopScreen.position.set(-1.02, 0.89, -1.3);
        laptopScreen.rotation.x = -0.18;
        roomGroup.add(laptopScreen);

        // Study Lamp
        const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.3, 10), matDarkWood);
        lampStem.position.set(-1.44, 0.91, -1.32);
        roomGroup.add(lampStem);

        const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 16), matLampShade);
        lampHead.position.set(-1.38, 1.05, -1.28);
        lampHead.rotation.z = -0.35;
        roomGroup.add(lampHead);

        // Desk Chair
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), matBlanket);
        chairSeat.position.set(-1.12, 0.46, -0.78);
        roomGroup.add(chairSeat);

        // Wardrobe (Left Wall)
        const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.68, 0.86), matWood);
        wardrobe.position.set(-1.5, 0.84, -0.12);
        wardrobe.castShadow = profile.shadows;
        roomGroup.add(wardrobe);

        // Helper to build a single or stacked bunk bed dynamically for capacity 1..4
        const buildBed = (bx: number, bz: number, by = 0, rotY = 0) => {
          const bed = new THREE.Group();
          bed.position.set(bx, by, bz);
          bed.rotation.y = rotY;

          const frame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.18, 1.68), matWood);
          frame.position.y = 0.22;
          frame.castShadow = profile.shadows;
          bed.add(frame);

          const head = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.56, 0.08), matDarkWood);
          head.position.set(0, 0.42, -0.82);
          bed.add(head);

          const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 1.56), matMattress);
          mattress.position.y = 0.36;
          bed.add(mattress);

          const duvet = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.15, 1.02), matBlanket);
          duvet.position.set(0, 0.37, 0.24);
          bed.add(duvet);

          const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.3), matPillow);
          pillow.position.set(0, 0.46, -0.56);
          bed.add(pillow);

          roomGroup.add(bed);
        };

        const safeCap = Math.min(4, Math.max(1, Math.round(capacity)));
        if (safeCap === 1) {
          buildBed(1.12, -0.45);
        } else if (safeCap === 2) {
          buildBed(1.25, -0.52);
          buildBed(0.18, 0.86, 0, Math.PI / 2);
        } else if (safeCap === 3) {
          buildBed(1.25, -0.52, 0);
          buildBed(1.25, -0.52, 0.88);
          buildBed(0.15, 0.88, 0, Math.PI / 2);
        } else {
          buildBed(1.25, -0.52, 0);
          buildBed(1.25, -0.52, 0.88);
          buildBed(0.15, 0.88, 0, Math.PI / 2);
          buildBed(0.15, 0.88, 0.88, Math.PI / 2);
        }

        // Potted Plant
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.11, 0.22, 14),
          new THREE.MeshStandardMaterial({ color: 0xc97a53, roughness: 0.7 }),
        );
        pot.position.set(1.52, 0.11, 1.25);
        roomGroup.add(pot);

        const leaves = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.24, 1),
          new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.72 }),
        );
        leaves.position.set(1.52, 0.38, 1.25);
        roomGroup.add(leaves);

        // Spinning Ceiling Fan
        const fanGroup = new THREE.Group();
        fanGroup.position.set(0.05, 2.08, 0.05);
        const fanHub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16),
          matTrim,
        );
        fanGroup.add(fanHub);
        for (let b = 0; b < 3; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.015, 0.11), matTrim);
          blade.rotation.y = (b * Math.PI * 2) / 3;
          blade.translateX(0.38);
          fanGroup.add(blade);
        }
        roomGroup.add(fanGroup);

        const syncSize = () => {
          if (!hostRef.current) return;
          const w = Math.max(hostRef.current.clientWidth, 180);
          const h = Math.max(hostRef.current.clientHeight, 150);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        syncSize();

        resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(target);

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            visible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0.05 },
        );
        intersectionObserver.observe(target);

        const daySky = new THREE.Color(0xbae6fd);
        const nightSky = new THREE.Color(0x1e293b);
        const clock = new THREE.Clock();

        const animate = () => {
          rafId = requestAnimationFrame(animate);
          if (!visible) return;

          const t = clock.getElapsedTime();
          const orbit = orbitRef.current;

          if (!orbit.isDragging && orbit.autoSway && !profile.reducedMotion) {
            orbit.azimuth += (orbit.targetAzimuth + Math.sin(t * 0.45) * 0.13 - orbit.azimuth) * 0.05;
          } else {
            orbit.azimuth += (orbit.targetAzimuth - orbit.azimuth) * 0.08;
          }
          orbit.polar += (orbit.targetPolar - orbit.polar) * 0.08;
          orbit.radius += (orbit.targetRadius - orbit.radius) * 0.08;

          const sinPhi = Math.sin(orbit.polar);
          camera.position.set(
            orbit.radius * sinPhi * Math.sin(orbit.azimuth),
            orbit.radius * Math.cos(orbit.polar),
            orbit.radius * sinPhi * Math.cos(orbit.azimuth),
          );
          camera.lookAt(0, 0.18, 0);

          // Smooth Day <-> Night Study lighting lerp (25 Residences style)
          const isNight = lightingRef.current === 'night';
          hemiLight.intensity += ((isNight ? 0.42 : 1.35) - hemiLight.intensity) * 0.07;
          sunLight.intensity += ((isNight ? 0.18 : 1.55) - sunLight.intensity) * 0.07;
          deskLampLight.intensity += ((isNight ? 2.65 : 0.75) - deskLampLight.intensity) * 0.08;
          matSkyGlass.color.lerp(isNight ? nightSky : daySky, 0.07);
          matSkyGlass.emissiveIntensity += ((isNight ? 0.08 : 0.35) - matSkyGlass.emissiveIntensity) * 0.07;
          matLampShade.emissiveIntensity += ((isNight ? 1.2 : 0.55) - matLampShade.emissiveIntensity) * 0.08;

          if (!profile.reducedMotion) {
            fanGroup.rotation.y = t * 4.2;
          }

          renderer.render(scene, camera);
        };
        animate();

        if (!cancelled) setWebglReady(true);

        cleanupThree = () => {
          disposeThreeScene(scene, renderer);
        };
      } catch {
        if (!cancelled) setWebglReady(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanupThree?.();
    };
  }, [capacity, hasAC, hasAttachedBath]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    orbitRef.current.isDragging = true;
    orbitRef.current.autoSway = false;
    orbitRef.current.lastX = e.clientX;
    orbitRef.current.lastY = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!orbitRef.current.isDragging) return;
    const dx = e.clientX - orbitRef.current.lastX;
    const dy = e.clientY - orbitRef.current.lastY;
    orbitRef.current.lastX = e.clientX;
    orbitRef.current.lastY = e.clientY;
    orbitRef.current.targetAzimuth = Math.max(
      -0.65,
      Math.min(1.45, orbitRef.current.targetAzimuth - dx * 0.008),
    );
    orbitRef.current.targetPolar = Math.max(
      0.14,
      Math.min(1.15, orbitRef.current.targetPolar - dy * 0.006),
    );
  };

  const endDrag = () => {
    orbitRef.current.isDragging = false;
    setDragging(false);
  };

  return (
    <div
      className={['sk-room3d', dragging ? 'sk-room3d--dragging' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ '--sk-room3d-height': `${height}px` } as React.CSSProperties}
      aria-label={roomName ? `3D model of ${roomName}` : '3D student room model'}
    >
      <div className="sk-room3d__hud-top">
        <span className="sk-room3d__badge">
          <Cuboid size={13} />
          {lightingMode === 'night' ? 'NIGHT STUDY LIGHTING' : '3D ROOM STUDIO'}
        </span>

        <div className="sk-room3d__controls">
          <button
            type="button"
            className={`sk-room3d__btn${lightingMode === 'night' ? ' is-active' : ''}`}
            onClick={() => setLightingMode((m) => (m === 'day' ? 'night' : 'day'))}
            aria-pressed={lightingMode === 'night'}
            title="Switch between morning sunlight and night study lamp lighting"
          >
            {lightingMode === 'day' ? <Moon size={11} /> : <Sun size={11} />}
            {lightingMode === 'day' ? 'Study night' : 'Morning sun'}
          </button>

          {(['isometric', 'desk', 'plan'] as RoomCameraPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`sk-room3d__btn sk-room3d__btn--preset${preset === key ? ' is-active' : ''}`}
              onClick={() => applyPreset(key)}
              aria-pressed={preset === key}
            >
              {CAMERA_PRESETS[key].label}
            </button>
          ))}

          <button
            type="button"
            className="sk-room3d__btn"
            onClick={resetCamera}
            aria-label="Reset 3D camera angle"
            title="Reset 3D camera & lighting"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      <div
        ref={hostRef}
        className="sk-room3d__canvas-host"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {webglReady === false && (
        <div className="sk-room3d__fallback">
          <RoomShowcase capacity={capacity} />
        </div>
      )}

      <div className="sk-room3d__hud-bottom">
        <span className="sk-room3d__hint">
          {hasAC ? 'AC · ' : ''}
          {hasAttachedBath ? 'Attached bath · ' : ''}
          {webglReady ? 'Drag to orbit' : 'Concept cutaway'}
        </span>
        <span className="sk-room3d__cap-pill">
          {capacity} {capacity === 1 ? 'Student · Single' : `Students · ${capacity}-Sharing`}
        </span>
      </div>
    </div>
  );
}
