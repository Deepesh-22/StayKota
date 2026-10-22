import { useEffect, useRef } from 'react';
import {
  detectGpuProfile,
  disposeThreeScene,
  hasWebGLSupport,
  loadThree,
} from '../../lib/gpu-budget';
import '../../styles/three-scenes.css';

export interface KotaHorizon3DCanvasProps {
  fullMask?: boolean;
  className?: string;
}

const SUNBEAM_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  attribute float aScale;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 0.65 + aPhase) * 0.28;
    pos.x += cos(uTime * 0.42 + aPhase * 1.3) * 0.18;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aScale * (28.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = 0.35 + 0.35 * sin(uTime * 1.1 + aPhase);
  }
`;

const SUNBEAM_FRAGMENT = /* glsl */ `
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, dist);
    gl_FragColor = vec4(0.08, 0.52, 0.45, soft * vAlpha * 0.55);
  }
`;

/**
 * HubTown (Unseen Studio) Inspired Atmospheric Three.js Horizon:
 * - Single `THREE.InstancedMesh` (1 GPU draw call total for 18 architectural Kota blocks!)
 * - Custom GLSL atmospheric sun-mote vertex/fragment shader
 * - Scroll-linked vertical parallax + smooth mouse sway + automatic off-screen pause
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
    let tabHidden = typeof document !== 'undefined' ? document.hidden : false;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let cleanupThree: (() => void) | null = null;

    const container = mountRef.current;
    if (!container) return;

    const profile = detectGpuProfile();
    if (profile.reducedMotion) return;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollOffset = 0;

    const onMove = (e: PointerEvent) => {
      if (window.innerWidth <= 0 || window.innerHeight <= 0) return;
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      scrollOffset = Math.min(1.4, window.scrollY / 420);
    };
    const onVisibility = () => {
      tabHidden = document.hidden;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    (async () => {
      try {
        if (!hasWebGLSupport()) return;
        const THREE = await loadThree();
        if (cancelled || !mountRef.current) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: profile.antialias,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(profile.dpr, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const el = mountRef.current;
        el.innerHTML = '';
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
        camera.position.set(0, 1.3, 9.5);

        scene.add(new THREE.HemisphereLight(0xf6fbf7, 0xc7dccd, 1.45));
        const sun = new THREE.DirectionalLight(0xfff5e0, 1.35);
        sun.position.set(5, 7, 6);
        scene.add(sun);

        const group = new THREE.Group();
        group.position.x = fullMask ? 0 : 2.1;
        scene.add(group);

        // Instanced architectural blocks (1 single draw call for all 18 blocks!)
        const count = 18;
        const boxGeo = new THREE.BoxGeometry(0.46, 0.85, 0.46);
        const boxMat = new THREE.MeshStandardMaterial({
          roughness: 0.45,
          metalness: 0.08,
          transparent: true,
          opacity: 0.55,
        });
        const instanced = new THREE.InstancedMesh(boxGeo, boxMat, count);
        const palette = [
          new THREE.Color(0x0f766e),
          new THREE.Color(0x2f8575),
          new THREE.Color(0x9bc4b0),
          new THREE.Color(0xdcc7a9),
          new THREE.Color(0xcba37c),
        ];

        const seeds = Array.from({ length: count }, (_, idx) => {
          const angle = (idx / count) * Math.PI * 2;
          const radius = 1.15 + (idx % 3) * 0.92;
          return {
            baseX: Math.cos(angle) * radius * 1.45,
            baseY: ((idx % 5) - 2) * 0.42,
            baseZ: Math.sin(angle) * radius * 0.68 - 1.1,
            scaleY: 0.65 + (idx % 4) * 0.36,
            phase: idx * 0.72,
          };
        });

        const dummy = new THREE.Object3D();
        seeds.forEach(( idxSeed, i) => {
          instanced.setColorAt(i, palette[i % palette.length]);
          dummy.position.set(idxSeed.baseX, idxSeed.baseY, idxSeed.baseZ);
          dummy.scale.set(1, idxSeed.scaleY, 1);
          dummy.updateMatrix();
          instanced.setMatrixAt(i, dummy.matrix);
        });
        instanced.instanceMatrix.needsUpdate = true;
        if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
        group.add(instanced);

        // Orbital compass rings
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x0f766e,
          transparent: true,
          opacity: 0.14,
        });
        const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.018, 10, 72), ringMat);
        ringA.rotation.set(1.15, 0.25, 0);
        group.add(ringA);

        const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.014, 10, 72), ringMat);
        ringB.rotation.set(1.32, -0.35, 0.2);
        group.add(ringB);

        // Custom GLSL atmospheric golden-emerald sun motes
        const pCount = profile.particleCount;
        const positions = new Float32Array(pCount * 3);
        const phases = new Float32Array(pCount);
        const scales = new Float32Array(pCount);
        for (let i = 0; i < pCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 9.5;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0 - 0.8;
          phases[i] = Math.random() * Math.PI * 2;
          scales[i] = 2.5 + Math.random() * 4.5;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        pGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

        const shaderUniforms = { uTime: { value: 0 } };
        const pMat = new THREE.ShaderMaterial({
          uniforms: shaderUniforms,
          vertexShader: SUNBEAM_VERTEX,
          fragmentShader: SUNBEAM_FRAGMENT,
          transparent: true,
          depthWrite: false,
        });
        const motes = new THREE.Points(pGeo, pMat);
        group.add(motes);

        const syncSize = () => {
          if (!mountRef.current) return;
          const w = Math.max(mountRef.current.clientWidth, 240);
          const h = Math.max(mountRef.current.clientHeight, 120);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        syncSize();

        resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(el);

        intersectionObserver = new IntersectionObserver(
          (entries) => {
            visible = entries[0]?.isIntersecting ?? true;
          },
          { threshold: 0.02 },
        );
        intersectionObserver.observe(el);

        const clock = new THREE.Clock();
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          if (!visible || tabHidden) return;

          const t = clock.getElapsedTime();
          shaderUniforms.uTime.value = t;

          pointer.x += (pointer.tx - pointer.x) * 0.05;
          pointer.y += (pointer.ty - pointer.y) * 0.05;

          group.rotation.y = pointer.x * 0.16 + Math.sin(t * 0.22) * 0.08;
          group.rotation.x = pointer.y * 0.09 + scrollOffset * 0.12;
          group.position.y = scrollOffset * 0.35;

          ringA.rotation.z = t * 0.07;
          ringB.rotation.z = -t * 0.05;

          for (let i = 0; i < count; i++) {
            const s = seeds[i];
            dummy.position.set(
              s.baseX,
              s.baseY + Math.sin(t * 0.85 + s.phase) * 0.14,
              s.baseZ,
            );
            dummy.rotation.set(
              Math.sin(t * 0.4 + s.phase) * 0.08,
              t * 0.12 + s.phase,
              0,
            );
            dummy.scale.set(1, s.scaleY, 1);
            dummy.updateMatrix();
            instanced.setMatrixAt(i, dummy.matrix);
          }
          instanced.instanceMatrix.needsUpdate = true;

          renderer.render(scene, camera);
        };
        animate();

        cleanupThree = () => {
          disposeThreeScene(scene, renderer);
        };
      } catch {
        // Silent graceful degradation on non-WebGL headless environments
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanupThree?.();
    };
  }, [fullMask]);

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
