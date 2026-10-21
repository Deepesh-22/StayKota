import { useEffect, useRef } from 'react';
import '../../styles/three-scenes.css';

export interface KotaHorizon3DCanvasProps {
  fullMask?: boolean;
  className?: string;
}

/**
 * Ambient GPU-accelerated Three.js 3D Floating Kota Architectural Blocks & Orbital Compass Rings.
 * Used exclusively on non-homepage routes (/explore, /how-it-works, /login).
 * Automatically pauses off-screen via IntersectionObserver and degrades silently if WebGL is unavailable.
 */
export function KotaHorizon3DCanvas({
  fullMask = false,
  className = '',
}: KotaHorizon3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let visible = true;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let cleanupThree: (() => void) | null = null;

    const container = mountRef.current;
    if (!container) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    (async () => {
      try {
        const THREE = await import('three');
        if (cancelled || !mountRef.current) return;

        const probe = document.createElement('canvas');
        const gl =
          probe.getContext('webgl2') ||
          probe.getContext('webgl') ||
          probe.getContext('experimental-webgl');
        if (!gl) return;

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        const w = Math.max(container.clientWidth, 320);
        const h = Math.max(container.clientHeight, 220);
        renderer.setSize(w, h);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
        camera.position.set(0, 0.4, 8.5);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xd8eadf, 1.45));
        const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.25);
        keyLight.position.set(5, 6, 6);
        scene.add(keyLight);

        const cluster = new THREE.Group();
        cluster.position.set(1.9, 0.1, 0);
        scene.add(cluster);

        // Two orbital StayKota compass rings
        const ringMatPrimary = new THREE.MeshStandardMaterial({
          color: 0x0f766e,
          transparent: true,
          opacity: 0.24,
          roughness: 0.35,
        });
        const ringMatSecondary = new THREE.MeshStandardMaterial({
          color: 0x8db8a2,
          transparent: true,
          opacity: 0.28,
          roughness: 0.45,
        });

        const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.022, 12, 72), ringMatPrimary);
        ringOuter.rotation.set(1.05, 0.35, 0.2);
        cluster.add(ringOuter);

        const ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.018, 12, 64), ringMatSecondary);
        ringInner.rotation.set(0.68, -0.5, -0.3);
        cluster.add(ringInner);

        // Floating stylized architectural residence & campus blocks
        const palette = [0x0f766e, 0xd3e6da, 0xfaf7ef, 0xe8d5b8, 0x3b8f7e];
        const blocks: {
          mesh: InstanceType<typeof THREE.Mesh>;
          baseY: number;
          speed: number;
          phase: number;
        }[] = [];

        const specs = [
          { size: [0.68, 1.05, 0.68], pos: [0.0, 0.15, 0.2], color: palette[0] },
          { size: [0.56, 0.78, 0.56], pos: [-1.05, -0.25, 0.65], color: palette[1] },
          { size: [0.5, 0.88, 0.5], pos: [1.12, 0.35, -0.35], color: palette[3] },
          { size: [0.42, 0.6, 0.42], pos: [-0.65, 0.85, -0.6], color: palette[2] },
          { size: [0.46, 0.66, 0.46], pos: [0.82, -0.68, 0.8], color: palette[4] },
        ];

        specs.forEach((spec, idx) => {
          const mat = new THREE.MeshStandardMaterial({
            color: spec.color,
            roughness: 0.48,
            metalness: 0.05,
          });
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(spec.size[0], spec.size[1], spec.size[2]),
            mat,
          );
          mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
          mesh.rotation.set(0.32, 0.6 + idx * 0.35, 0.12);
          cluster.add(mesh);
          blocks.push({
            mesh,
            baseY: spec.pos[1],
            speed: 0.7 + idx * 0.18,
            phase: idx * 1.25,
          });
        });

        let pointerX = 0;
        let pointerY = 0;
        const onPointer = (e: PointerEvent) => {
          pointerX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
          pointerY = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
        };
        window.addEventListener('pointermove', onPointer, { passive: true });

        const clock = new THREE.Clock();
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          if (!visible) return;
          const t = clock.getElapsedTime();

          cluster.rotation.y += (pointerX * 0.28 + Math.sin(t * 0.25) * 0.18 - cluster.rotation.y) * 0.04;
          cluster.rotation.x += (-pointerY * 0.16 - cluster.rotation.x) * 0.04;
          ringOuter.rotation.z = t * 0.16;
          ringInner.rotation.z = -t * 0.22;

          blocks.forEach((b) => {
            b.mesh.position.y = b.baseY + Math.sin(t * b.speed + b.phase) * 0.12;
            b.mesh.rotation.y += 0.0025;
          });

          renderer.render(scene, camera);
        };
        animate();

        resizeObserver = new ResizeObserver((entries) => {
          const rect = entries[0]?.contentRect;
          if (!rect) return;
          const nw = Math.max(rect.width, 200);
          const nh = Math.max(rect.height, 150);
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        });
        resizeObserver.observe(container);

        if (typeof IntersectionObserver !== 'undefined') {
          intersectionObserver = new IntersectionObserver(
            (entries) => {
              visible = Boolean(entries[0]?.isIntersecting);
            },
            { threshold: 0.02 },
          );
          intersectionObserver.observe(container);
        }

        cleanupThree = () => {
          window.removeEventListener('pointermove', onPointer);
          cancelAnimationFrame(rafId);
          resizeObserver?.disconnect();
          intersectionObserver?.disconnect();
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
        // Degrade silently in environments without WebGL support
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanupThree?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={['sk-horizon3d', fullMask ? 'sk-horizon3d--full' : '', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
