import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import {
  detectGpuProfile,
  disposeThreeScene,
  hasWebGLSupport,
  loadThree,
} from '../../lib/gpu-budget';
import type { Hostel } from '../../types';
import { monthlyTotal } from '../../lib/discovery';
import '../../styles/three-scenes.css';

export interface KotaZoneSpec {
  id: string;
  campusId: string;
  name: string;
  institutes: string;
  tagline: string;
  x: number;
  z: number;
  accent: number;
}

export const KOTA_COACHING_ZONES: KotaZoneSpec[] = [
  {
    id: 'landmark',
    campusId: 'allen-landmark',
    name: 'Landmark City',
    institutes: 'ALLEN Landmark · Safalya',
    tagline: 'Planned northern student township',
    x: -2.55,
    z: -1.15,
    accent: 0x0f766e,
  },
  {
    id: 'kunhari',
    campusId: 'allen-samyak',
    name: 'Kunhari',
    institutes: 'ALLEN Samyak · Sangyan · Supath',
    tagline: 'Chambal riverside hostel belt',
    x: -1.15,
    z: -1.45,
    accent: 0x128277,
  },
  {
    id: 'indravihar',
    campusId: 'allen-sankalp',
    name: 'Indra Vihar',
    institutes: 'ALLEN Sankalp · PW · Aakash',
    tagline: 'Central walkable coaching hub',
    x: -0.25,
    z: 0.25,
    accent: 0x0d9488,
  },
  {
    id: 'talwandi',
    campusId: 'allen-talwandi',
    name: 'Talwandi',
    institutes: 'ALLEN Talwandi · Satyarth',
    tagline: 'Tree-lined residential PG lanes',
    x: -1.55,
    z: 1.25,
    accent: 0xd97706,
  },
  {
    id: 'rajeev',
    campusId: 'motion-rajiv',
    name: 'Rajeev Gandhi Nagar',
    institutes: 'Motion · Resonance · Nucleon',
    tagline: 'High-density student hostel corridor',
    x: 1.05,
    z: 0.95,
    accent: 0x059669,
  },
  {
    id: 'vigyan',
    campusId: 'vibrant-demo',
    name: 'Vigyan Nagar',
    institutes: 'Vibrant · Unacademy · Bansal',
    tagline: 'Affordable stays & mess options',
    x: 2.45,
    z: -0.35,
    accent: 0x2563eb,
  },
];

export interface KotaDistrictMap3DCanvasProps {
  selectedCampusId: string;
  hostels: Hostel[];
  onSelectCampus: (campusId: string) => void;
}

/**
 * Montreal (montreal.leeroy.ca) + Primland Inspired Interactive 3D Kota Coaching Districts Map:
 * - Renders 60+ Kota PG & coaching buildings across 6 real Kota hubs using a single
 *   `THREE.InstancedMesh` (1 GPU draw call — scales effortlessly to 40,000 students!).
 * - Sculpted Chambal River ribbon + glowing 3D coaching spires + smooth camera flight
 *   whenever a student clicks any Kota coaching neighborhood pill.
 */
export function KotaDistrictMap3DCanvas({
  selectedCampusId,
  hostels,
  onSelectCampus,
}: KotaDistrictMap3DCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(true);

  const activeZone = useMemo(() => {
    const exact = KOTA_COACHING_ZONES.find((z) => z.campusId === selectedCampusId);
    if (exact) return exact;
    if (selectedCampusId.includes('talwandi') || selectedCampusId.includes('satyarth')) {
      return KOTA_COACHING_ZONES[3];
    }
    if (selectedCampusId.includes('samyak') || selectedCampusId.includes('sangyan') || selectedCampusId.includes('supath')) {
      return KOTA_COACHING_ZONES[1];
    }
    if (selectedCampusId.includes('sankalp') || selectedCampusId.includes('pw') || selectedCampusId.includes('aakash')) {
      return KOTA_COACHING_ZONES[2];
    }
    if (selectedCampusId.includes('vibrant') || selectedCampusId.includes('unacademy') || selectedCampusId.includes('bansal')) {
      return KOTA_COACHING_ZONES[5];
    }
    if (selectedCampusId.includes('rajiv') || selectedCampusId.includes('vigyan') || selectedCampusId.includes('nucleon')) {
      return KOTA_COACHING_ZONES[4];
    }
    return KOTA_COACHING_ZONES[0];
  }, [selectedCampusId]);

  const zoneStats = useMemo(() => {
    const approved = hostels.filter((h) => h.status === 'approved');
    const localMatches = approved.filter((h) =>
      h.locality.toLowerCase().includes(activeZone.name.split(' ')[0].toLowerCase()),
    );
    const pool = localMatches.length ? localMatches : approved;
    const rents = pool.flatMap((h) => h.roomTypes.filter((r) => r.available).map(monthlyTotal));
    const minRent = rents.length ? Math.min(...rents) : null;
    return {
      count: localMatches.length || approved.length,
      minRent,
    };
  }, [hostels, activeZone]);

  const focusRef = useRef({ x: activeZone.x, z: activeZone.z, yaw: 0 });
  focusRef.current.x = activeZone.x;
  focusRef.current.z = activeZone.z;

  useEffect(() => {
    if (!expanded) return;
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
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const mountNode = hostRef.current;
        mountNode.innerHTML = '';
        mountNode.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
        camera.position.set(0, 5.2, 7.6);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.HemisphereLight(0xf7fcf8, 0xc3d9c8, 1.4));
        const sun = new THREE.DirectionalLight(0xfff5df, 1.6);
        sun.position.set(6, 9, 5);
        sun.castShadow = profile.shadows;
        scene.add(sun);

        const world = new THREE.Group();
        scene.add(world);

        // Kota terrain board
        const terrain = new THREE.Mesh(
          new THREE.BoxGeometry(7.6, 0.24, 4.7),
          new THREE.MeshStandardMaterial({ color: 0xe2efe5, roughness: 0.88 }),
        );
        terrain.position.y = -0.12;
        terrain.receiveShadow = true;
        world.add(terrain);

        // Stylized Chambal River ribbon diagonally dividing Northern Kunhari/Landmark & Central Kota
        const riverCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-3.65, 0.02, -0.35),
          new THREE.Vector3(-1.85, 0.02, -0.55),
          new THREE.Vector3(-0.35, 0.02, -0.68),
          new THREE.Vector3(1.45, 0.02, -1.05),
          new THREE.Vector3(3.65, 0.02, -1.35),
        ]);
        const river = new THREE.Mesh(
          new THREE.TubeGeometry(riverCurve, 44, 0.16, 8, false),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.22,
            metalness: 0.15,
            transparent: true,
            opacity: 0.72,
          }),
        );
        river.scale.y = 0.14;
        world.add(river);

        // Instanced PG & hostel blocks clustered around all 6 Kota hubs (1 draw call total!)
        const blocksPerZone = 9;
        const totalBlocks = KOTA_COACHING_ZONES.length * blocksPerZone;
        const blockGeo = new THREE.BoxGeometry(0.28, 1, 0.28);
        const blockMat = new THREE.MeshStandardMaterial({ roughness: 0.62 });
        const cityBlocks = new THREE.InstancedMesh(blockGeo, blockMat, totalBlocks);
        cityBlocks.castShadow = profile.shadows;
        cityBlocks.receiveShadow = profile.shadows;

        const blockPalette = [
          new THREE.Color(0xfffaf0),
          new THREE.Color(0xe9d6b8),
          new THREE.Color(0xd2e4d8),
          new THREE.Color(0xd8b896),
        ];

        const dummy = new THREE.Object3D();
        let idx = 0;
        KOTA_COACHING_ZONES.forEach((zone, zIndex) => {
          for (let b = 0; b < blocksPerZone; b++) {
            const angle = (b / blocksPerZone) * Math.PI * 2 + zIndex * 0.5;
            const dist = 0.42 + (b % 3) * 0.22;
            const h = 0.24 + ((b * 3 + zIndex) % 5) * 0.13;
            dummy.position.set(
              zone.x + Math.cos(angle) * dist,
              h / 2,
              zone.z + Math.sin(angle) * dist * 0.85,
            );
            dummy.rotation.y = (b * 0.4) % Math.PI;
            dummy.scale.set(1, h, 1);
            dummy.updateMatrix();
            cityBlocks.setMatrixAt(idx, dummy.matrix);
            cityBlocks.setColorAt(idx, blockPalette[(idx + zIndex) % blockPalette.length]);
            idx++;
          }
        });
        cityBlocks.instanceMatrix.needsUpdate = true;
        if (cityBlocks.instanceColor) cityBlocks.instanceColor.needsUpdate = true;
        world.add(cityBlocks);

        // Coaching Campus Spire Landmarks per Zone
        const spires: import('three').Mesh[] = [];
        KOTA_COACHING_ZONES.forEach((zone) => {
          const spire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.2, 0.92, 8),
            new THREE.MeshStandardMaterial({
              color: zone.accent,
              roughness: 0.32,
              metalness: 0.14,
            }),
          );
          spire.position.set(zone.x, 0.46, zone.z);
          spire.castShadow = profile.shadows;
          world.add(spire);

          const cap = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.15, 0),
            new THREE.MeshStandardMaterial({
              color: 0xfef3c7,
              emissive: zone.accent,
              emissiveIntensity: 0.5,
              roughness: 0.25,
            }),
          );
          cap.position.set(zone.x, 1.08, zone.z);
          spires.push(cap);
          world.add(cap);
        });

        // Active Zone Spotlight Halo & Floating Beacon Ring
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.52, 0.78, 40),
          new THREE.MeshBasicMaterial({
            color: 0x0f766e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.68,
          }),
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(activeZone.x, 0.03, activeZone.z);
        world.add(halo);

        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.68, 1.75, 24, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0x14b8a6,
            transparent: true,
            opacity: 0.14,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        beam.position.set(activeZone.x, 0.88, activeZone.z);
        world.add(beam);

        const syncSize = () => {
          if (!hostRef.current) return;
          const w = Math.max(hostRef.current.clientWidth, 240);
          const h = Math.max(hostRef.current.clientHeight, 160);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        syncSize();

        resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(mountNode);

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            visible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0.05 },
        );
        intersectionObserver.observe(mountNode);

        const camLook = new THREE.Vector3(activeZone.x * 0.45, 0, activeZone.z * 0.45);
        const clock = new THREE.Clock();

        const animate = () => {
          rafId = requestAnimationFrame(animate);
          if (!visible) return;

          const t = clock.getElapsedTime();

          // Smooth camera & spotlight glide toward newly selected Kota zone
          halo.position.x += (focusRef.current.x - halo.position.x) * 0.09;
          halo.position.z += (focusRef.current.z - halo.position.z) * 0.09;
          beam.position.x = halo.position.x;
          beam.position.z = halo.position.z;

          const pulse = 0.92 + Math.sin(t * 2.8) * 0.12;
          halo.scale.set(pulse, pulse, 1);

          const targetCamX = focusRef.current.x * 0.55 + Math.sin(t * 0.3) * 0.25;
          const targetCamZ = 6.9 + focusRef.current.z * 0.45;
          camera.position.x += (targetCamX - camera.position.x) * 0.06;
          camera.position.z += (targetCamZ - camera.position.z) * 0.06;

          camLook.x += (focusRef.current.x * 0.55 - camLook.x) * 0.08;
          camLook.z += (focusRef.current.z * 0.55 - camLook.z) * 0.08;
          camera.lookAt(camLook);

          spires.forEach((cap, i) => {
            cap.rotation.y = t * 1.2 + i;
            if (!profile.reducedMotion) {
              cap.position.y = 1.08 + Math.sin(t * 2.1 + i) * 0.06;
            }
          });

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
  }, [expanded]);

  return (
    <section className="sk-district3d" aria-label="Interactive 3D Kota coaching hubs explorer">
      <div className="sk-district3d__bar">
        <div className="sk-district3d__heading">
          <span className="sk-district3d__kicker">
            <Compass size={13} /> 3D KOTA COACHING MICRO-CITY
          </span>
          <strong>
            {activeZone.name} · <em>{activeZone.institutes}</em>
          </strong>
          <small>{activeZone.tagline}</small>
        </div>

        <div className="sk-district3d__meta">
          <span className="sk-district3d__stat">
            <Sparkles size={12} /> {zoneStats.count} stays nearby
            {zoneStats.minRent ? ` · from ₹${zoneStats.minRent.toLocaleString('en-IN')}/mo` : ''}
          </span>
          <Link className="sk-district3d__map-link" to={`/map?campus=${activeZone.campusId}&view=3d`}>
            Full 3D Kota Map <ArrowUpRight size={13} />
          </Link>
          <button
            type="button"
            className="sk-district3d__toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide 3D view' : 'Show 3D view'}
          </button>
        </div>
      </div>

      <div className="sk-district3d__pills" role="group" aria-label="Select a Kota coaching hub in 3D">
        {KOTA_COACHING_ZONES.map((zone) => {
          const isSelected = zone.id === activeZone.id;
          return (
            <button
              key={zone.id}
              type="button"
              className={isSelected ? 'is-active' : ''}
              aria-pressed={isSelected}
              onClick={() => onSelectCampus(zone.campusId)}
            >
              <span>{zone.name}</span>
              <small>{zone.institutes.split('·')[0].trim()}</small>
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="sk-district3d__stage">
          <div
            ref={hostRef}
            className="sk-district3d__canvas"
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (!rect.width) return;
              const ratio = (e.clientX - rect.left) / rect.width;
              const picked =
                KOTA_COACHING_ZONES[
                  Math.min(
                    KOTA_COACHING_ZONES.length - 1,
                    Math.max(0, Math.floor(ratio * KOTA_COACHING_ZONES.length)),
                  )
                ];
              if (picked) onSelectCampus(picked.campusId);
            }}
          />
          {webglReady === false && (
            <div className="sk-district3d__fallback">
              {KOTA_COACHING_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className={zone.id === activeZone.id ? 'is-active' : ''}
                  onClick={() => onSelectCampus(zone.campusId)}
                >
                  <strong>{zone.name}</strong>
                  <span>{zone.institutes}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
