import React, { useEffect, useRef, useState } from 'react';
import { Cuboid, RotateCcw } from 'lucide-react';
import { RoomShowcase } from '../hostel/RoomShowcase';
import '../../styles/three-scenes.css';

export interface HostelRoom3DCanvasProps {
  capacity?: number;
  roomName?: string;
  height?: number;
  className?: string;
}

/**
 * Interactive Three.js WebGL 3D Architectural Student Room Diorama.
 * Dynamically builds 1–4 student beds, study desk + glowing lamp, bookshelf,
 * wardrobe, sunlit Kota window, indoor plant, spinning ceiling fan & light motes.
 * Gracefully falls back to SVG cutaway if WebGL is unavailable (e.g. headless test runners).
 */
export function HostelRoom3DCanvas({
  capacity = 2,
  roomName,
  height = 300,
  className = '',
}: HostelRoom3DCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [autoSpin, setAutoSpin] = useState(true);
  const [dragging, setDragging] = useState(false);

  const orbitRef = useRef({
    targetAzimuth: 0.72,
    azimuth: 0.72,
    targetPolar: 0.56,
    polar: 0.56,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;

  const resetCamera = () => {
    orbitRef.current.targetAzimuth = 0.72;
    orbitRef.current.targetPolar = 0.56;
  };

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let cleanupThree: (() => void) | null = null;

    const host = hostRef.current;
    if (!host) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    (async () => {
      try {
        const THREE = await import('three');
        if (cancelled || !hostRef.current) return;

        // Verify WebGL context creation safely before constructing full scene
        const probeCanvas = document.createElement('canvas');
        const gl =
          probeCanvas.getContext('webgl2') ||
          probeCanvas.getContext('webgl') ||
          probeCanvas.getContext('experimental-webgl');
        if (!gl) {
          if (!cancelled) setWebglReady(false);
          return;
        }

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;

        const width = Math.max(host.clientWidth, 280);
        const initialHeight = Math.max(host.clientHeight, height);
        renderer.setSize(width, initialHeight);
        host.innerHTML = '';
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, width / initialHeight, 0.1, 60);

        // Warm natural lighting rig
        const hemi = new THREE.HemisphereLight(0xfffcf6, 0xd8e5db, 1.35);
        scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xfff3dd, 1.45);
        sun.position.set(4.6, 7.2, 4.4);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 20;
        sun.shadow.camera.left = -4.5;
        sun.shadow.camera.right = 4.5;
        sun.shadow.camera.top = 4.5;
        sun.shadow.camera.bottom = -4.5;
        sun.shadow.bias = -0.0008;
        scene.add(sun);

        const rim = new THREE.DirectionalLight(0xbde6d8, 0.55);
        rim.position.set(-5, 4, -3);
        scene.add(rim);

        // Root room diorama group
        const roomGroup = new THREE.Group();
        roomGroup.position.y = -0.55;
        scene.add(roomGroup);

        // Shared materials palette (StayKota warm architectural theme)
        const matPlinth = new THREE.MeshStandardMaterial({ color: 0xdbe9df, roughness: 0.72 });
        const matFloor = new THREE.MeshStandardMaterial({ color: 0xe6cfa8, roughness: 0.62 });
        const matWall = new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.85 });
        const matTrim = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 });
        const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x9b734c, roughness: 0.58 });
        const matWoodLight = new THREE.MeshStandardMaterial({ color: 0xc8a378, roughness: 0.55 });
        const matSheet = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
        const matDuvet = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.65 });
        const matDuvetAlt = new THREE.MeshStandardMaterial({ color: 0x2f8f7f, roughness: 0.65 });
        const matRug = new THREE.MeshStandardMaterial({ color: 0xd4e6da, roughness: 0.9 });
        const matGlass = new THREE.MeshStandardMaterial({
          color: 0xd6f0f6,
          emissive: 0x9bd7e5,
          emissiveIntensity: 0.35,
          roughness: 0.18,
        });
        const matMetal = new THREE.MeshStandardMaterial({
          color: 0x384b45,
          metalness: 0.45,
          roughness: 0.38,
        });
        const matLampGlow = new THREE.MeshStandardMaterial({
          color: 0xffe4a8,
          emissive: 0xffb84d,
          emissiveIntensity: 1.2,
          roughness: 0.3,
        });
        const matPlant = new THREE.MeshStandardMaterial({ color: 0x1c7c5c, roughness: 0.65 });
        const matPot = new THREE.MeshStandardMaterial({ color: 0xc97b53, roughness: 0.7 });

        // Base plinth & hardwood floor
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 4.1), matPlinth);
        plinth.position.set(0, -0.1, 0);
        plinth.receiveShadow = true;
        roomGroup.add(plinth);

        const trimRing = new THREE.Mesh(new THREE.BoxGeometry(4.54, 0.04, 4.14), matTrim);
        trimRing.position.set(0, -0.02, 0);
        roomGroup.add(trimRing);

        const floor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 3.8), matFloor);
        floor.position.set(0, 0.04, 0);
        floor.receiveShadow = true;
        roomGroup.add(floor);

        // Woven bedroom rug
        const rug = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.025, 1.5), matRug);
        rug.position.set(0.15, 0.1, 0.25);
        rug.receiveShadow = true;
        roomGroup.add(rug);

        // Cutaway back & left walls
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.25, 0.12), matWall);
        backWall.position.set(0, 1.18, -1.84);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        roomGroup.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.25, 3.8), matWall);
        leftWall.position.set(-2.04, 1.18, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        roomGroup.add(leftWall);

        // Window on back wall letting in morning light
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.96, 0.16), matWoodDark);
        winFrame.position.set(0.35, 1.38, -1.83);
        roomGroup.add(winFrame);

        const winPane = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.8, 0.18), matGlass);
        winPane.position.set(0.35, 1.38, -1.83);
        roomGroup.add(winPane);

        // Helper to build a stylized bed unit
        const createBed = (x: number, y: number, z: number, altColor = false) => {
          const bed = new THREE.Group();
          const frame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 1.82), matWoodDark);
          frame.position.y = 0.16;
          frame.castShadow = true;
          frame.receiveShadow = true;
          bed.add(frame);

          const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.52, 0.08), matWoodDark);
          headboard.position.set(0, 0.34, -0.88);
          headboard.castShadow = true;
          bed.add(headboard);

          const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.15, 1.72), matSheet);
          mattress.position.y = 0.3;
          mattress.castShadow = true;
          bed.add(mattress);

          const duvet = new THREE.Mesh(
            new THREE.BoxGeometry(0.86, 0.16, 1.18),
            altColor ? matDuvetAlt : matDuvet,
          );
          duvet.position.set(0, 0.31, 0.24);
          duvet.castShadow = true;
          bed.add(duvet);

          const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.32), matSheet);
          pillow.position.set(0, 0.41, -0.58);
          pillow.castShadow = true;
          bed.add(pillow);

          bed.position.set(x, y, z);
          return bed;
        };

        const clampedCap = Math.max(1, Math.min(4, Math.round(capacity)));
        if (clampedCap === 1) {
          roomGroup.add(createBed(-1.18, 0.09, -0.55));
        } else if (clampedCap === 2) {
          roomGroup.add(createBed(-1.26, 0.09, -0.68, false));
          roomGroup.add(createBed(-0.12, 0.09, -0.68, true));
        } else if (clampedCap === 3) {
          roomGroup.add(createBed(-1.3, 0.09, -0.72, false));
          roomGroup.add(createBed(-0.22, 0.09, -0.72, true));
          const sideBed = createBed(-1.28, 0.09, 0.92, false);
          sideBed.rotation.y = Math.PI / 2;
          roomGroup.add(sideBed);
        } else {
          // Twin 2-tier bunk beds for 4-sharing room
          roomGroup.add(createBed(-1.26, 0.09, -0.68, false));
          roomGroup.add(createBed(-1.26, 0.98, -0.68, true));
          roomGroup.add(createBed(-0.12, 0.09, -0.68, true));
          roomGroup.add(createBed(-0.12, 0.98, -0.68, false));
          [-1.7, -0.82, -0.56, 0.32].forEach((px) => {
            [-1.54, 0.18].forEach((pz) => {
              const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), matWoodDark);
              post.position.set(px, 0.84, pz);
              roomGroup.add(post);
            });
          });
        }

        //Kota Student Study Desk + Chair + Laptop + Glowing Study Lamp
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 0.62), matWoodLight);
        deskTop.position.set(1.32, 0.76, -1.36);
        deskTop.castShadow = true;
        roomGroup.add(deskTop);

        [
          [0.8, -1.6],
          [1.84, -1.6],
          [0.8, -1.12],
          [1.84, -1.12],
        ].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.06), matMetal);
          leg.position.set(lx, 0.42, lz);
          leg.castShadow = true;
          roomGroup.add(leg);
        });

        // Laptop on desk
        const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.25), matMetal);
        laptopBase.position.set(1.24, 0.8, -1.32);
        roomGroup.add(laptopBase);

        const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.02), matGlass);
        laptopScreen.position.set(1.24, 0.91, -1.45);
        laptopScreen.rotation.x = -0.22;
        roomGroup.add(laptopScreen);

        // Warm study desk lamp + point light
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 14), matLampGlow);
        lampShade.position.set(1.68, 1.04, -1.46);
        roomGroup.add(lampShade);

        const deskLight = new THREE.PointLight(0xffb85c, 0.85, 2.6);
        deskLight.position.set(1.68, 0.96, -1.42);
        roomGroup.add(deskLight);

        // Ergonomic study chair
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), matDuvet);
        chairSeat.position.set(1.26, 0.48, -0.82);
        chairSeat.castShadow = true;
        roomGroup.add(chairSeat);

        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.06), matDuvet);
        chairBack.position.set(1.26, 0.7, -0.63);
        chairBack.castShadow = true;
        roomGroup.add(chairBack);

        // Wardrobe & indoor potted plant in front-right corner
        const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.58, 0.95), matWoodLight);
        wardrobe.position.set(1.68, 0.88, 0.35);
        wardrobe.castShadow = true;
        wardrobe.receiveShadow = true;
        roomGroup.add(wardrobe);

        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 12), matPot);
        pot.position.set(1.62, 0.22, 1.28);
        pot.castShadow = true;
        roomGroup.add(pot);

        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), matPlant);
        foliage.position.set(1.62, 0.52, 1.28);
        foliage.castShadow = true;
        roomGroup.add(foliage);

        // Overhead spinning ceiling fan
        const fanGroup = new THREE.Group();
        fanGroup.position.set(0.15, 2.02, 0.05);
        const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), matMetal);
        fanGroup.add(fanHub);
        for (let b = 0; b < 3; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.02, 0.12), matWoodDark);
          const holder = new THREE.Group();
          blade.position.x = 0.4;
          holder.add(blade);
          holder.rotation.y = (b * Math.PI * 2) / 3;
          fanGroup.add(holder);
        }
        roomGroup.add(fanGroup);

        // Subtle floating sunlit dust motes
        const particleCount = 26;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
          particlePositions[i * 3] = (Math.random() - 0.5) * 3.2;
          particlePositions[i * 3 + 1] = 0.3 + Math.random() * 1.6;
          particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0x0f766e,
          size: 0.045,
          transparent: true,
          opacity: 0.45,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        roomGroup.add(particles);

        if (!cancelled) setWebglReady(true);

        const clock = new THREE.Clock();
        const radius = 6.35;

        const renderFrame = () => {
          const elapsed = clock.getElapsedTime();
          const orbit = orbitRef.current;

          if (!reducedMotion && autoSpinRef.current && !orbit.isDragging) {
            orbit.targetAzimuth = 0.72 + Math.sin(elapsed * 0.42) * 0.26;
          }

          orbit.azimuth += (orbit.targetAzimuth - orbit.azimuth) * 0.085;
          orbit.polar += (orbit.targetPolar - orbit.polar) * 0.085;

          camera.position.x = Math.sin(orbit.azimuth) * Math.cos(orbit.polar * 0.45) * radius;
          camera.position.y = 2.65 + (orbit.polar - 0.56) * 2.2;
          camera.position.z = Math.cos(orbit.azimuth) * Math.cos(orbit.polar * 0.45) * radius;
          camera.lookAt(0, 0.22, 0);

          if (!reducedMotion) {
            fanGroup.rotation.y = elapsed * 2.6;
            particles.rotation.y = elapsed * 0.08;
            roomGroup.position.y = -0.55 + Math.sin(elapsed * 1.1) * 0.02;
          }

          renderer.render(scene, camera);
          if (!reducedMotion) {
            rafId = requestAnimationFrame(renderFrame);
          }
        };

        renderFrame();

        resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          const w = Math.max(entry.contentRect.width, 200);
          const h = Math.max(entry.contentRect.height, 180);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          if (reducedMotion) renderFrame();
        });
        resizeObserver.observe(host);

        cleanupThree = () => {
          cancelAnimationFrame(rafId);
          resizeObserver?.disconnect();
          scene.traverse((obj) => {
            const mesh = obj as unknown as {
              geometry?: { dispose: () => void };
              material?: { dispose: () => void } | { dispose: () => void }[];
            };
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
            else mesh.material?.dispose();
          });
          renderer.dispose();
        };
      } catch {
        if (!cancelled) setWebglReady(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      cleanupThree?.();
    };
  }, [capacity, height]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    orbitRef.current.isDragging = true;
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
    orbitRef.current.targetAzimuth -= dx * 0.009;
    orbitRef.current.targetPolar = Math.max(
      0.22,
      Math.min(0.95, orbitRef.current.targetPolar + dy * 0.005),
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
      style={{ ['--sk-room3d-height' as string]: `${height}px` }}
      aria-label={`Interactive 3D room model${roomName ? ` for ${roomName}` : ''}`}
    >
      <div className="sk-room3d__hud-top">
        <span className="sk-room3d__badge">
          <span className="sk-room3d__dot" />
          <Cuboid size={13} />
          THREE.JS 3D ROOM VIEW
        </span>
        {webglReady && (
          <div className="sk-room3d__controls">
            <button
              type="button"
              className={`sk-room3d__btn${autoSpin ? ' is-active' : ''}`}
              onClick={() => setAutoSpin((v) => !v)}
              aria-pressed={autoSpin}
            >
              {autoSpin ? 'Auto-sway' : 'Paused'}
            </button>
            <button
              type="button"
              className="sk-room3d__btn"
              onClick={resetCamera}
              aria-label="Reset 3D camera angle"
              title="Reset 3D angle"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        )}
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
          {webglReady ? 'Drag horizontally to orbit 3D room' : 'Concept cutaway view'}
        </span>
        <span className="sk-room3d__cap-pill">
          {capacity} {capacity === 1 ? 'Student · Single' : `Students · ${capacity}-Sharing`}
        </span>
      </div>
    </div>
  );
}
