import { useEffect, type RefObject } from 'react';

/** Pointer work is batched into frames; the loop sleeps as soon as the scene settles. */
export function useKotaSketchMotion(surfaceRef: RefObject<HTMLDivElement | null>, svgRef: RefObject<SVGSVGElement | null>, revealRef: RefObject<SVGCircleElement | null>, fullColour: boolean) {
  useEffect(() => {
    const surface = surfaceRef.current, svg = svgRef.current, reveal = revealRef.current;
    if (!surface || !svg || !reveal) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const buildings = [...svg.querySelectorAll<SVGGElement>('[data-lift-x]')].map(node => ({ node, x: Number(node.dataset.liftX), y: Number(node.dataset.liftY) }));
    let frame = 0, lastTime = 0, active = false;
    let targetX = 410, targetY = 280, x = 410, y = 280, amount = 0, tiltX = 0, tiltY = 0;
    const staticColour = () => fullColour || reduce.matches;
    const paint = () => {
      reveal.setAttribute('cx', String(x));
      reveal.setAttribute('cy', String(y));
      reveal.setAttribute('r', staticColour() ? '1500' : '190');
      reveal.style.opacity = staticColour() ? '1' : String(amount);
      surface.style.setProperty('--map-rx', `${tiltX}deg`);
      surface.style.setProperty('--map-ry', `${tiltY}deg`);
      for (const building of buildings) {
        const proximity = Math.max(0, 1 - Math.hypot(building.x - x, building.y - y) / 190);
        building.node.style.setProperty('--lift', `${reduce.matches ? 0 : -9 * proximity * amount}px`);
      }
    };
    const animate = (now: number) => {
      const step = 1 - Math.exp(-Math.min(lastTime ? now - lastTime : 16, 50) / 90);
      lastTime = now;
      const nextAmount = active ? 1 : 0;
      const nextTiltX = active ? (280 - targetY) / 110 : 0;
      const nextTiltY = active ? (targetX - 410) / 150 : 0;
      x += (targetX - x) * step; y += (targetY - y) * step;
      amount += (nextAmount - amount) * step;
      tiltX += (nextTiltX - tiltX) * step; tiltY += (nextTiltY - tiltY) * step;
      paint();
      if (Math.abs(targetX - x) + Math.abs(targetY - y) + Math.abs(nextAmount - amount) * 100 + Math.abs(nextTiltX - tiltX) + Math.abs(nextTiltY - tiltY) > .02) {
        frame = requestAnimationFrame(animate);
      } else { frame = 0; lastTime = 0; }
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !fine.matches || reduce.matches) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      targetX = Math.max(0, Math.min(820, position.x));
      targetY = Math.max(0, Math.min(560, position.y));
      active = true; wake();
    };
    const leave = () => { active = false; wake(); };
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0; active = false;
      amount = 0; tiltX = 0; tiltY = 0; paint();
    };
    const visibility = () => { if (document.hidden) reset(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) reset(); });
    observer.observe(surface);
    paint();
    surface.addEventListener('pointermove', move);
    surface.addEventListener('pointerleave', leave);
    surface.addEventListener('pointercancel', reset);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', visibility);
    reduce.addEventListener('change', reset);
    fine.addEventListener('change', reset);
    return () => {
      reset(); observer.disconnect();
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerleave', leave);
      surface.removeEventListener('pointercancel', reset);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', visibility);
      reduce.removeEventListener('change', reset);
      fine.removeEventListener('change', reset);
    };
  }, [surfaceRef, svgRef, revealRef, fullColour]);
}
