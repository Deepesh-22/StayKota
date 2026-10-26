import React, { useEffect, useRef, useState } from 'react';
import { Cuboid, RotateCcw } from 'lucide-react';
import {
  detectGpuProfile,
  disposeThreeScene,
  hasWebGLSupport,
  loadThree,
} from '../../lib/gpu-budget';
import '../../styles/three-scenes.css';

export interface ShortlistBarItem {
  id: string;
  name: string;
  monthlyRent: number;
  distanceKm: number | null;
}

export interface KotaShortlist3DCanvasProps {
  items: ShortlistBarItem[];
  campusName: string;
  height?: number;
}

/**
 * Interactive Three.js 3D Shortlist Cost & Campus Proximity Skyline (/compare).
 * Sculpted architectural towers scale dynamically with monthly fixed rent while
 * glowing emerald base rings scale inversely with distance to the selected campus.
 */
export function KotaShortlist3DCanvas({
  items,
  campusName,
  height = 230,
}: KotaShortlist3DCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState(false);

  const orbitRef = useRef({
    active: false,
    lastX: 0,
    angle: 0.34,
    velocity: 0,
  });

  const resetOrbit = () => {
    orbitRef.current.angle = 0.34;
    orbitRef.current.velocity = 0;
  };

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let cleanupScene: (() => void) | null = null;

    const el = hostRef.current;
    if (!el || items.length === 0) return;

    const profile = detectGpuProfile();
    const reducedMotion = profile.reducedMotion;

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
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const target = hostRef.current;
        target.innerHTML = '';
        target.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
        camera.position.set(0, 3.6, 8.8);
        camera.lookAt(0, 1.0, 0);

        scene.add(new THREE.HemisphereLight(0xf6fbf7, 0xc7dacb, 1.35));
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
        sun.position.set(5, 8.5, 6);
        sun.castShadow = true;
        scene.add(sun);

        const stage = new THREE.Group();
        scene.add(stage);

        // Architectural base deck
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(7.2, 0.22, 3.4),
          new THREE.MeshStandardMaterial({ color: 0xe3efe6, roughness: 0.85 }),
        );
        deck.position.y = -0.11;
        deck.receiveShadow = true;
        stage.add(deck);

        const maxRent = Math.max(...items.map((i) => i.monthlyRent || 6000), 6000);
        const validRents = items.filter((i) => i.monthlyRent > 0).map((i) => i.monthlyRent);
        const bestRent = validRents.length ? Math.min(...validRents) : 0;

        const palette = [0x0f766e, 0x1e6b5c, 0x2f7d6d];
        const crystals: import('three').Mesh[] = [];

        const spacing = items.length === 1 ? 0 : items.length === 2 ? 2.4 : 2.25;
        const startX = -((items.length - 1) * spacing) / 2;

        items.forEach((item, idx) => {
          const x = startX + idx * spacing;
          const ratio = item.monthlyRent > 0 ? Math.max(0.38, item.monthlyRent / maxRent) : 0.35;
          const towerH = 0.85 + ratio * 1.95;
          const isBestValue = item.monthlyRent > 0 && item.monthlyRent === bestRent;

          const towerMat = new THREE.MeshStandardMaterial({
            color: palette[idx % palette.length],
            roughness: 0.38,
            metalness: 0.1,
          });
          const tower = new THREE.Mesh(new THREE.BoxGeometry(1.18, towerH, 1.18), towerMat);
          tower.position.set(x, towerH / 2, 0);
          tower.castShadow = true;
          tower.receiveShadow = true;
          stage.add(tower);

          // Cream cornice cap
          const cap = new THREE.Mesh(
            new THREE.BoxGeometry(1.28, 0.12, 1.28),
            new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.55 }),
          );
          cap.position.set(x, towerH + 0.06, 0);
          stage.add(cap);

          // Illuminated windows along tower facade
          const floors = Math.max(2, Math.round(towerH / 0.52));
          const winMat = new THREE.MeshStandardMaterial({
            color: 0xffe8ad,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.55,
            roughness: 0.3,
          });
          for (let f = 0; f < floors; f++) {
            const wy = 0.32 + f * ((towerH - 0.38) / Math.max(1, floors));
            for (const wx of [-0.28, 0.28]) {
              const win = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.05), winMat);
              win.position.set(x + wx, wy, 0.59);
              stage.add(win);
            }
          }

          // Proximity halo ring (tighter bright emerald ring = closer to coaching campus)
          const dist = item.distanceKm ?? 2.5;
          const ringRadius = Math.min(1.05, Math.max(0.76, 0.72 + dist * 0.08));
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(ringRadius - 0.07, ringRadius, 36),
            new THREE.MeshBasicMaterial({
              color: dist <= 1.2 ? 0x10b981 : 0x528272,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.55,
            }),
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(x, 0.02, 0);
          stage.add(ring);

          // Floating crown marker (Gold star for lowest monthly total, mint diamond otherwise)
          const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(isBestValue ? 0.22 : 0.15, 0),
            new THREE.MeshStandardMaterial({
              color: isBestValue ? 0xf59e0b : 0x2dd4bf,
              emissive: isBestValue ? 0xd97706 : 0x0f766e,
              emissiveIntensity: 0.45,
              roughness: 0.25,
            }),
          );
          gem.position.set(x, towerH + 0.45, 0);
          gem.userData.baseY = towerH + 0.45;
          crystals.push(gem);
          stage.add(gem);
        });

        const syncSize = () => {
          if (!hostRef.current) return;
          const w = Math.max(hostRef.current.clientWidth, 200);
          const h = Math.max(hostRef.current.clientHeight, 150);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        syncSize();
        resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(target);

        const clock = new THREE.Clock();
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          if (!orbitRef.current.active) {
            orbitRef.current.velocity *= 0.92;
            orbitRef.current.angle +=
              (reducedMotion ? 0 : Math.sin(t * 0.55) * 0.0018) + orbitRef.current.velocity;
          }
          stage.rotation.y = orbitRef.current.angle;

          crystals.forEach((gem, i) => {
            gem.rotation.y = t * 1.4 + i;
            if (!reducedMotion) {
              gem.position.y = (gem.userData.baseY as number) + Math.sin(t * 2.2 + i) * 0.08;
            }
          });

          renderer.render(scene, camera);
        };
        animate();

        if (!cancelled) setWebglReady(true);

        cleanupScene = () => {
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
      cleanupScene?.();
    };
  }, [items]);

  return (
    <div
      className={`sk-shortlist3d${dragging ? ' is-dragging' : ''}`}
      style={{ height }}
      aria-label="3D shortlist cost and proximity visual comparison"
    >
      <div className="sk-room3d__hud-top">
        <span className="sk-room3d__badge">
          <Cuboid size={13} /> 3D COST &amp; COMMUTE SKYLINE · {campusName.toUpperCase()}
        </span>
        {webglReady && (
          <button
            type="button"
            className="sk-room3d__btn"
            onClick={resetOrbit}
            title="Reset 3D angle"
          >
            <RotateCcw size={12} /> Reset angle
          </button>
        )}
      </div>

      <div
        ref={hostRef}
        className="sk-room3d__canvas-host"
        onPointerDown={(e) => {
          orbitRef.current.active = true;
          orbitRef.current.lastX = e.clientX;
          setDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!orbitRef.current.active) return;
          const dx = e.clientX - orbitRef.current.lastX;
          orbitRef.current.lastX = e.clientX;
          orbitRef.current.angle += dx * 0.01;
          orbitRef.current.velocity = dx * 0.002;
        }}
        onPointerUp={() => {
          orbitRef.current.active = false;
          setDragging(false);
        }}
        onPointerCancel={() => {
          orbitRef.current.active = false;
          setDragging(false);
        }}
      />

      {webglReady === false && (
        <div className="sk-shortlist3d__fallback">
          {items.map((item) => (
            <div key={item.id} className="sk-shortlist3d__fallback-bar">
              <strong>{item.name}</strong>
              <span>
                {item.monthlyRent > 0 ? `₹${item.monthlyRent.toLocaleString('en-IN')}/mo` : 'Select room'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="sk-shortlist3d__legend">
        {items.map((item, index) => (
          <span key={item.id}>
            <i>0{index + 1}</i>
            <strong>{item.name}</strong>
            <em>
              {item.monthlyRent > 0
                ? `₹${item.monthlyRent.toLocaleString('en-IN')}/mo`
                : 'Select room'}
            </em>
          </span>
        ))}
      </div>
    </div>
  );
}
