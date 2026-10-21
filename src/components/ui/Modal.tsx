import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; };
  }, [open]);
  return <dialog ref={ref} className={`sk-modal ${wide ? 'sk-modal--wide' : ''}`} aria-label={title}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}
    onClick={event => { if (event.target === ref.current) { const r = ref.current!.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeRef.current(); } }}>
    <div className="sk-modal__header"><h2>{title}</h2><button type="button" onClick={onClose} className="sk-icon-button" aria-label="Close dialog"><X size={20} /></button></div>
    <div className="sk-modal__body">{children}</div>
  </dialog>;
}
