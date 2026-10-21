import React, { useEffect, useRef, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import '../../styles/three-scenes.css';

export interface KotaBeacon3DCanvasProps {
  mode?: 'campus' | 'detour';
  height?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Interactive Three.js WebGL 3D Kota Campus & Hostel Waypoint Island Diorama.
 * - `mode="campus"` (/login, /how-it-works, /dashboard): Sculpted botanical Kota island
 *   with sandstone hostel residence, glowing warm windows, coaching institute pavilion,
 *   floating 3D emerald StayKota beacon pin, dashed route stones & orbiting golden stars.
 * - `mode="detour"` (/404 NotFoundPage): Interactive 3D spinning Kota compass rose,
 *   tilted emerald waypoint pin, sandstone corner cottage & orbital navigation rings.
 * Supports horizontal drag-to-orbit inertia + clean WebGL disposal + SVG fallback.
 */
export function KotaBeacon3DCanvas({
  mode = 'campus',
  height = 240,
  label,
  compact = false,
  className = '',
}: KotaBeacon3DCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef({
    active: false,
    lastX: 0,
    velocity: 0,
    angle: mode === 'detour' ? -0.35 : 0.48,
  });

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let isVisible = true;
    let cleanupScene: (() => void) | null = null;

    const container = hostRef.current;
    if (!container) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    (async () => {
      try {
        const THREE = await import('three');
        if (cancelled || !hostRef.current) return;

        const probe = document.createElement('canvas');
        const gl =
          probe.getContext('webgl2') ||
          probe.getContext('webgl') ||
          probe.getContext('experimental-webgl');

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
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const el = hostRef.current;
        el.innerHTML = '';
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
        camera.position.set(0, 4.3, 8.6);
        camera.lookAt(0, 0.55, 0);

        // Warm botanical lighting
        const hemi = new THREE.HemisphereLight(0xf6fbf7, 0xc8dacb, 1.35);
        scene.add(hemi);

        const dir = new THREE.DirectionalLight(0xfff5e4, 1.55);
        dir.position.set(5.5, 9, 6);
        dir.castShadow = true;
        dir.shadow.mapSize.set(512, 512);
        scene.add(dir);

        const rim = new THREE.DirectionalLight(0x2dd4bf, 0.55);
        rim.position.set(-6, 4, -5);
        scene.add(rim);

        const beaconGlow = new THREE.PointLight(0x14b8a6, 1.1, 6.5);
        beaconGlow.position.set(0.9, 2.2, 0.4);
        scene.add(beaconGlow);

        const world = new THREE.Group();
        scene.add(world);

        // Shared Materials
        const matGrass = new THREE.MeshStandardMaterial({ color: 0xd9eadc, roughness: 0.85 });
        const matEarth = new THREE.MeshStandardMaterial({ color: 0xc2d5c4, roughness: 0.9 });
        const matSandstone = new THREE.MeshStandardMaterial({ color: 0xe9d6b9, roughness: 0.72 });
        const matTerracotta = new THREE.MeshStandardMaterial({ color: 0xc9966b, roughness: 0.65 });
        const matCream = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.6 });
        const matEmerald = new THREE.MeshStandardMaterial({
          color: 0x0f766e,
          roughness: 0.32,
          metalness: 0.14,
        });
        const matMint = new THREE.MeshStandardMaterial({
          color: 0x2dd4bf,
          emissive: 0x0f766e,
          emissiveIntensity: 0.35,
          roughness: 0.25,
        });
        const matWarmWindow = new THREE.MeshStandardMaterial({
          color: 0xffe4a3,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.65,
          roughness: 0.3,
        });
        const matGold = new THREE.MeshStandardMaterial({
          color: 0xeab308,
          emissive: 0xd97706,
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.35,
        });
        const matFoliage = new THREE.MeshStandardMaterial({ color: 0x4d8b6f, roughness: 0.78 });
        const matTrunk = new THREE.MeshStandardMaterial({ color: 0x85664b, roughness: 0.9 });

        // Sculpted layered Kota island base
        const baseTop = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.22, 0.34, 40), matGrass);
        baseTop.position.y = -0.18;
        baseTop.receiveShadow = true;
        world.add(baseTop);

        const baseRim = new THREE.Mesh(new THREE.CylinderGeometry(3.22, 2.75, 0.32, 40), matEarth);
        baseRim.position.y = -0.48;
        world.add(baseRim);

        // Orbital ring around island
        const orbitRing = new THREE.Mesh(
          new THREE.TorusGeometry(3.48, 0.028, 12, 72),
          new THREE.MeshBasicMaterial({ color: 0x0f766e, transparent: true, opacity: 0.28 }),
        );
        orbitRing.rotation.x = Math.PI / 2;
        orbitRing.position.y = -0.05;
        world.add(orbitRing);

        // Floating emerald 3D map pin group
        const pinGroup = new THREE.Group();
        const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 24), matEmerald);
        pinHead.position.y = 0.62;
        pinHead.castShadow = true;
        pinGroup.add(pinHead);

        const pinCone = new THREE.Mesh(new THREE.ConeGeometry(0.41, 0.72, 24), matEmerald);
        pinCone.rotation.x = Math.PI;
        pinCone.position.y = 0.16;
        pinCone.castShadow = true;
        pinGroup.add(pinCone);

        const pinCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matCream);
        pinCore.position.set(0, 0.62, 0.32);
        pinGroup.add(pinCore);
        const pinCoreBack = pinCore.clone();
        pinCoreBack.position.set(0, 0.62, -0.32);
        pinGroup.add(pinCoreBack);

        // Ripple halo beneath pin
        const pulseRing = new THREE.Mesh(
          new THREE.RingGeometry(0.32, 0.56, 32),
          new THREE.MeshBasicMaterial({
            color: 0x0f766e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45,
          }),
        );
        pulseRing.rotation.x = -Math.PI / 2;

        let compassNeedle: import('three').Group | null = null;
        const stars: import('three').Mesh[] = [];

        if (mode === 'campus') {
          // Student Hostel Residence (left)
          const hostelGroup = new THREE.Group();
          hostelGroup.position.set(-1.05, 0, -0.15);

          const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.55, 1.25), matSandstone);
          body.position.y = 0.775;
          body.castShadow = true;
          body.receiveShadow = true;
          hostelGroup.add(body);

          const roof = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.14, 1.38), matTerracotta);
          roof.position.y = 1.61;
          roof.castShadow = true;
          hostelGroup.add(roof);

          // Warm lit windows on front & side
          const winGeo = new THREE.BoxGeometry(0.24, 0.28, 0.06);
          for (const rowY of [0.58, 1.12]) {
            for (const colX of [-0.36, 0.36]) {
              const wFront = new THREE.Mesh(winGeo, matWarmWindow);
              wFront.position.set(colX, rowY, 0.62);
              hostelGroup.add(wFront);
            }
          }
          world.add(hostelGroup);

          // Coaching Campus Pavilion (back-right)
          const campusGroup = new THREE.Group();
          campusGroup.position.set(1.15, 0, -0.55);

          const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.05, 1.05), matCream);
          cBody.position.y = 0.525;
          cBody.castShadow = true;
          campusGroup.add(cBody);

          const cDome = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.28, 20), matEmerald);
          cDome.position.y = 1.18;
          cDome.castShadow = true;
          campusGroup.add(cDome);
          world.add(campusGroup);

          // Stepping route stones connecting Hostel <-> Coaching
          for (let i = 0; i < 6; i++) {
            const t = i / 5;
            const stone = new THREE.Mesh(
              new THREE.CylinderGeometry(0.11, 0.12, 0.06, 12),
              matCream,
            );
            stone.position.set(-0.65 + t * 1.75, 0.02, 0.55 - Math.sin(t * Math.PI) * 0.35);
            world.add(stone);
          }

          pinGroup.position.set(0.95, 1.65, 0.72);
          pulseRing.position.set(0.95, 0.03, 0.72);
          world.add(pinGroup);
          world.add(pulseRing);
        } else {
          // 404 Detour Compass Island Mode
          const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.62, 0.14, 36), matCream);
          dial.position.set(0, 0.08, 0);
          dial.receiveShadow = true;
          world.add(dial);

          const dialRing = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.06, 12, 48), matEmerald);
          dialRing.rotation.x = Math.PI / 2;
          dialRing.position.y = 0.15;
          world.add(dialRing);

          compassNeedle = new THREE.Group();
          compassNeedle.position.set(0, 0.26, 0);

          const north = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.15, 4), matEmerald);
          north.rotation.x = Math.PI / 2;
          north.position.z = -0.56;
          compassNeedle.add(north);

          const south = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.15, 4), matTerracotta);
          south.rotation.x = -Math.PI / 2;
          south.position.z = 0.56;
          compassNeedle.add(south);

          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 20), matGold);
          compassNeedle.add(hub);
          world.add(compassNeedle);

          // Small cozy hostel cottage beside compass
          const cottage = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), matSandstone);
          cottage.position.set(-1.65, 0.42, -0.9);
          cottage.castShadow = true;
          world.add(cottage);

          const cRoof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.5, 4), matTerracotta);
          cRoof.position.set(-1.65, 1.09, -0.9);
          cRoof.rotation.y = Math.PI / 4;
          world.add(cRoof);

          pinGroup.position.set(1.55, 1.25, 0.75);
          pulseRing.position.set(1.55, 0.03, 0.75);
          world.add(pinGroup);
          world.add(pulseRing);
        }

        // Stylized trees on the island
        const treeCoords: [number, number, number][] = [
          [-2.05, 0, 1.15],
          [2.05, 0, -0.15],
          [-0.25, 0, -1.95],
        ];
        for (const [tx, ty, tz] of treeCoords) {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.42, 8), matTrunk);
          trunk.position.set(tx, ty + 0.2, tz);
          world.add(trunk);
          const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 1), matFoliage);
          crown.position.set(tx, ty + 0.58, tz);
          crown.castShadow = true;
          world.add(crown);
        }

        // Orbiting golden study motes
        const starGeo = new THREE.OctahedronGeometry(0.11, 0);
        for (let s = 0; s < 4; s++) {
          const star = new THREE.Mesh(starGeo, s % 2 === 0 ? matGold : matMint);
          stars.push(star);
          world.add(star);
        }

        const syncSize = () => {
          if (!hostRef.current) return;
          const w = Math.max(hostRef.current.clientWidth, 160);
          const h = Math.max(hostRef.current.clientHeight, 140);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        syncSize();

        resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(el);

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            isVisible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0.05 },
        );
        intersectionObserver.observe(el);

        const clock = new THREE.Clock();
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          if (!isVisible) return;

          const t = clock.getElapsedTime();
          if (!dragRef.current.active) {
            dragRef.current.velocity *= 0.93;
            dragRef.current.angle += (reducedMotion ? 0 : 0.0038) + dragRef.current.velocity;
          }
          world.rotation.y = dragRef.current.angle;
          world.position.y = reducedMotion ? 0 : Math.sin(t * 1.4) * 0.07;

          pinGroup.position.y =
            (mode === 'campus' ? 1.65 : 1.25) + (reducedMotion ? 0 : Math.sin(t * 2.4) * 0.13);
          pinGroup.rotation.y = t * 0.9;

          const pulse = 0.85 + ((Math.sin(t * 2.4) + 1) * 0.5) * 0.5;
          pulseRing.scale.set(pulse, pulse, 1);

          if (compassNeedle && !reducedMotion) {
            compassNeedle.rotation.y = Math.sin(t * 1.15) * 0.65 + t * 0.25;
          }

          stars.forEach((star, idx) => {
            const a = t * 0.65 + idx * ((Math.PI * 2) / stars.length);
            star.position.set(Math.cos(a) * 2.65, 1.35 + Math.sin(t * 1.8 + idx) * 0.22, Math.sin(a) * 2.65);
            star.rotation.x = t * 1.3;
            star.rotation.y = t * 1.1;
          });

          renderer.render(scene, camera);
        };
        animate();

        if (!cancelled) setWebglReady(true);

        cleanupScene = () => {
          scene.traverse((obj) => {
            const mesh = obj as import('three').Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => m.dispose());
            }
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
      intersectionObserver?.disconnect();
      cleanupScene?.();
    };
  }, [mode]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    dragRef.current.lastX = e.clientX;
    dragRef.current.angle += dx * 0.011;
    dragRef.current.velocity = dx * 0.0025;
  };

  const endDrag = () => {
    dragRef.current.active = false;
    setDragging(false);
  };

  return (
    <div
      className={[
        'sk-beacon3d',
        compact ? 'sk-beacon3d--compact' : '',
        dragging ? 'is-dragging' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height }}
    >
      <div className="sk-beacon3d__badge">
        {mode === 'detour' ? <Compass size={12} /> : <Sparkles size={12} />}
        <span>{label || (mode === 'detour' ? '3D KOTA COMPASS' : '3D KOTA CAMPUS ISLAND')}</span>
      </div>

      <div
        ref={hostRef}
        className="sk-beacon3d__host"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {webglReady === false && (
        <svg className="sk-beacon3d__fallback" viewBox="0 0 420 230" aria-hidden="true">
          <ellipse cx="210" cy="190" rx="172" ry="26" fill="#dcebe0" />
          <path
            d="M42 168 150 120 252 170 378 108"
            fill="none"
            stroke="#fffdf5"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <g>
            <path d="m88 92 58-28 60 28v80l-60 28-58-28z" fill="#e5d0b1" />
            <path d="m146 120 60-28v80l-60 28z" fill="#cbb38e" />
            <path d="m88 92 58-28 60 28-60 28z" fill="#fff7e7" />
          </g>
          <path
            d="M289 39c-25 0-42 18-42 40 0 29 42 64 42 64s42-35 42-64c0-22-17-40-42-40"
            fill="#0f766e"
          />
          <circle cx="289" cy="78" r="13" fill="#fffdf5" />
        </svg>
      )}
    </div>
  );
}
