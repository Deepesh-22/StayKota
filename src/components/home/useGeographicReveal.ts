import { useEffect, type RefObject } from 'react';
import { projectKota, KOTA_FOCUS_AREAS } from '../../lib/hero-geography';

export function useGeographicReveal(svgRef: RefObject<SVGSVGElement | null>, lensRef: RefObject<SVGCircleElement | null>, area: typeof KOTA_FOCUS_AREAS[number] | null, colour: boolean) {
  useEffect(() => {
    const svg = svgRef.current, lens = lensRef.current;
    if (!svg || !lens) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0, last = 0;
    let [x, y] = area ? projectKota(area.longitude, area.latitude) : [350, 325];
    let tx = x, ty = y, opacity = area ? 1 : 0, targetOpacity = opacity;
    const paint = () => {
      lens.setAttribute('cx', String(x)); lens.setAttribute('cy', String(y));
      lens.setAttribute('r', colour || reduce.matches ? '1400' : area?.id === 'city' ? '240' : '155');
      lens.style.opacity = colour || reduce.matches ? '1' : String(opacity);
    };
    const tick = (time: number) => {
      const step = 1 - Math.exp(-Math.min(last ? time - last : 16, 50) / 65); last = time;
      x += (tx - x) * step; y += (ty - y) * step; opacity += (targetOpacity - opacity) * step;
      paint();
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(targetOpacity - opacity) * 100 > .02) frame = requestAnimationFrame(tick);
      else { frame = 0; last = 0; }
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !fine.matches || reduce.matches) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      tx = point.x; ty = point.y; targetOpacity = 1; wake();
    };
    const leave = () => {
      if (area) { [tx, ty] = projectKota(area.longitude, area.latitude); targetOpacity = 1; }
      else targetOpacity = 0;
      wake();
    };
    const reset = () => { cancelAnimationFrame(frame); frame = 0; last = 0; opacity = targetOpacity = area ? 1 : 0; paint(); };
    const visibility = () => { if (document.hidden) reset(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) reset(); });
    observer.observe(svg);
    paint();
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerleave', leave); svg.addEventListener('pointercancel', reset);
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', visibility);
    reduce.addEventListener('change', reset); fine.addEventListener('change', reset);
    return () => {
      reset(); observer.disconnect(); svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerleave', leave); svg.removeEventListener('pointercancel', reset);
      window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', visibility); reduce.removeEventListener('change', reset); fine.removeEventListener('change', reset);
    };
  }, [svgRef, lensRef, area, colour]);
}
