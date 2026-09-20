import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} />
      <div
        ref={panelRef}
        className={`relative bg-white w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-t-2xl md:rounded-2xl border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -m-2 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
