import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react';

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  startScroll: number;
  started: boolean;
  deck: HTMLDivElement;
};

type Options = {
  deckRef: RefObject<HTMLDivElement | null>;
  paused: boolean;
  onManualInteraction?: () => void;
};

const interactive = 'button, a, input, select, textarea, [contenteditable="true"], [role="button"]';

function isControl(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(interactive)) && !target.closest('[data-carousel-drag-surface]');
}

function keyboardFocusIn(deck: HTMLDivElement) {
  const focused = document.activeElement;
  return focused instanceof Element && deck.contains(focused) && focused.matches(':focus-visible');
}

/** Mouse enhancements only; browsers retain native touch scrolling and pinch zoom. */
export function useFeaturedDeckMotion({ deckRef, paused, onManualInteraction }: Options) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEdgeScrolling, setIsEdgeScrolling] = useState(false);
  const drag = useRef<Drag | null>(null);
  const edgeFrame = useRef(0);
  const edgeVelocity = useRef(0);
  const edgePosition = useRef(0);
  const edgeTime = useRef(0);
  const edgeRunning = useRef(false);
  const suppressClick = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollStyle = useRef<{ deck: HTMLDivElement; snap: string; behavior: string } | null>(null);
  const current = useRef({ paused, onManualInteraction });
  current.current = { paused, onManualInteraction };

  const lockScrollStyle = useCallback((deck: HTMLDivElement) => {
    if (!scrollStyle.current) scrollStyle.current = { deck, snap: deck.style.scrollSnapType, behavior: deck.style.scrollBehavior };
    deck.style.scrollSnapType = 'none';
    deck.style.scrollBehavior = 'auto';
  }, []);

  const restoreScrollStyle = useCallback(() => {
    if (edgeRunning.current || drag.current?.started) return;
    const saved = scrollStyle.current;
    if (saved) {
      saved.deck.style.scrollSnapType = saved.snap;
      saved.deck.style.scrollBehavior = saved.behavior;
      scrollStyle.current = null;
    }
  }, []);

  const stopEdge = useCallback((updateState = true) => {
    cancelAnimationFrame(edgeFrame.current);
    edgeFrame.current = 0;
    edgeTime.current = 0;
    edgeVelocity.current = 0;
    const wasRunning = edgeRunning.current;
    edgeRunning.current = false;
    if (wasRunning && updateState) setIsEdgeScrolling(false);
    restoreScrollStyle();
  }, [restoreScrollStyle]);

  const finishDrag = useCallback((updateState = true) => {
    const pending = drag.current;
    drag.current = null;
    if (pending?.started) {
      if (pending.deck.hasPointerCapture(pending.pointerId)) pending.deck.releasePointerCapture(pending.pointerId);
      suppressClick.current = true;
      if (clickTimer.current) clearTimeout(clickTimer.current);
      // A browser click follows pointerup; don't consume a later intentional click.
      clickTimer.current = setTimeout(() => { suppressClick.current = false; clickTimer.current = null; }, 350);
      if (updateState) setIsDragging(false);
    }
    restoreScrollStyle();
  }, [restoreScrollStyle]);

  const stopMotion = useCallback(() => {
    stopEdge();
    finishDrag();
  }, [stopEdge, finishDrag]);

  const edgeStep = useCallback(function step(now: number) {
    const deck = deckRef.current;
    if (!deck || current.current.paused || document.hidden || keyboardFocusIn(deck) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopEdge();
      return;
    }
    const elapsed = Math.min(now - edgeTime.current, 40);
    edgeTime.current = now;
    const maximum = deck.scrollWidth - deck.clientWidth;
    edgePosition.current = Math.max(0, Math.min(maximum, edgePosition.current + edgeVelocity.current * elapsed / 1000));
    deck.scrollLeft = edgePosition.current;
    if ((edgeVelocity.current < 0 && edgePosition.current <= 0) || (edgeVelocity.current > 0 && edgePosition.current >= maximum)) {
      stopEdge();
      return;
    }
    edgeFrame.current = requestAnimationFrame(step);
  }, [deckRef, stopEdge]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    stopEdge();
    if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary || current.current.paused || isControl(event.target)) return;
    current.current.onManualInteraction?.();
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startScroll: event.currentTarget.scrollLeft, started: false, deck: event.currentTarget };
  }, [stopEdge]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const pending = drag.current;
    if (pending && pending.pointerId === event.pointerId) {
      const deltaX = event.clientX - pending.startX;
      const deltaY = event.clientY - pending.startY;
      if (!pending.started) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) { drag.current = null; return; }
        if (Math.abs(deltaX) < 8) return;
        pending.started = true;
        lockScrollStyle(pending.deck);
        setIsDragging(true);
        pending.deck.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      pending.deck.scrollLeft = Math.max(0, Math.min(pending.deck.scrollWidth - pending.deck.clientWidth, pending.startScroll - deltaX));
      return;
    }

    const deck = event.currentTarget;
    if (event.pointerType !== 'mouse' || event.buttons !== 0 || current.current.paused || isControl(event.target) || keyboardFocusIn(deck)
      || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopEdge();
      return;
    }
    const bounds = deck.getBoundingClientRect();
    const zone = Math.min(76, bounds.width * .17);
    const x = event.clientX - bounds.left;
    const factor = x < zone ? -(1 - Math.max(0, x) / zone) : x > bounds.width - zone ? 1 - Math.max(0, bounds.width - x) / zone : 0;
    if (!factor || deck.scrollWidth <= deck.clientWidth + 2 || (factor < 0 && deck.scrollLeft <= 1) || (factor > 0 && deck.scrollLeft >= deck.scrollWidth - deck.clientWidth - 1)) {
      stopEdge();
      return;
    }
    edgeVelocity.current = factor * 150;
    if (!edgeRunning.current) {
      current.current.onManualInteraction?.();
      edgeRunning.current = true;
      lockScrollStyle(deck);
      setIsEdgeScrolling(true);
      edgeTime.current = performance.now();
      edgePosition.current = deck.scrollLeft;
      edgeFrame.current = requestAnimationFrame(edgeStep);
    }
  }, [edgeStep, lockScrollStyle, stopEdge]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) finishDrag();
  }, [finishDrag]);

  const onPointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
    stopEdge();
    if (drag.current?.pointerId === event.pointerId) finishDrag();
  }, [stopEdge, finishDrag]);

  const onPointerLeave = useCallback(() => {
    stopEdge();
    if (!drag.current?.started) drag.current = null;
  }, [stopEdge]);

  const onClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = null;
  }, []);

  useEffect(() => {
    if (paused) stopMotion();
  }, [paused, stopMotion]);

  useEffect(() => {
    const deck = deckRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const visibility = () => { if (document.hidden) stopMotion(); };
    const focus = () => stopEdge();
    const reduce = () => { if (reduceMotion.matches) stopEdge(); };
    deck?.addEventListener('focusin', focus);
    window.addEventListener('blur', stopMotion);
    document.addEventListener('visibilitychange', visibility);
    reduceMotion.addEventListener('change', reduce);
    return () => {
      deck?.removeEventListener('focusin', focus);
      window.removeEventListener('blur', stopMotion);
      document.removeEventListener('visibilitychange', visibility);
      reduceMotion.removeEventListener('change', reduce);
      stopEdge(false);
      finishDrag(false);
      if (clickTimer.current) clearTimeout(clickTimer.current);
      suppressClick.current = false;
    };
  }, [deckRef, stopMotion, stopEdge, finishDrag]);

  return { isDragging, isEdgeScrolling, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave, onClickCapture, stopMotion };
}
