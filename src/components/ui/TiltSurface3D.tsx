import React, { useRef, type PointerEvent } from 'react';

interface TiltSurface3DProps extends React.HTMLAttributes<HTMLDivElement> {
  maxTilt?: number;
  glare?: boolean;
  children: React.ReactNode;
}

/**
 * GPU-accelerated interactive 3D tilt & specular sheen wrapper.
 * Automatically respects prefers-reduced-motion and non-mouse pointers.
 */
export function TiltSurface3D({
  maxTilt = 6,
  glare = true,
  className = '',
  children,
  onPointerMove,
  onPointerLeave,
  ...rest
}: TiltSurface3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * (maxTilt * 2);
    const ry = (px - 0.5) * (maxTilt * 2);
    el.style.setProperty('--sk-tilt-rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--sk-tilt-ry', `${ry.toFixed(2)}deg`);
    el.style.setProperty('--sk-glare-x', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--sk-glare-y', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--sk-glare-opacity', '1');
  };

  const resetSurface = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--sk-tilt-rx', '0deg');
    el.style.setProperty('--sk-tilt-ry', '0deg');
    el.style.setProperty('--sk-glare-opacity', '0');
  };

  const handleLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    resetSurface();
  };

  return (
    <div
      ref={ref}
      className={['sk-tilt-3d', className].filter(Boolean).join(' ')}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onMouseLeave={resetSurface}
      {...rest}
    >
      {children}
      {glare && <span className="sk-tilt-3d__glare" aria-hidden="true" />}
    </div>
  );
}
