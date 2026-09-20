import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 disabled:bg-primary-700/60',
  secondary: 'bg-white text-primary-800 border border-stone-300 hover:bg-stone-50 disabled:text-stone-400',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'bg-transparent text-ink-900 hover:bg-stone-100',
};

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold min-h-[44px] transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const BADGE_TONES: Record<BadgeTone, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  gray: 'bg-stone-100 text-stone-700 border-stone-200',
};

export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function riskTone(level: string): BadgeTone {
  if (level === 'HIGH') return 'red';
  if (level === 'MEDIUM') return 'amber';
  return 'green';
}

export function severityTone(level: string): BadgeTone {
  if (level === 'HIGH') return 'red';
  if (level === 'MODERATE') return 'amber';
  return 'green';
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      {icon && <div className="mx-auto mb-4 text-stone-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {body && <p className="mt-1.5 text-sm text-ink-600 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card p-8 text-center" role="alert">
      <AlertTriangle className="mx-auto mb-4 w-8 h-8 text-amber-600" aria-hidden />
      <p className="text-sm text-ink-600">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label={label}>
      <Loader2 className="w-7 h-7 animate-spin text-primary-700" aria-hidden />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse" aria-hidden>
      <div className="h-4 w-24 bg-stone-200 rounded mb-3" />
      <div className="h-8 w-32 bg-stone-200 rounded mb-2" />
      <div className="h-3 w-40 bg-stone-100 rounded" />
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-ink-900">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-600">{subtitle}</p>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-stone-900/50" onClick={onCancel} />
      <div className="relative card p-6 w-full max-w-sm">
        <h2 id="confirm-title" className="text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
