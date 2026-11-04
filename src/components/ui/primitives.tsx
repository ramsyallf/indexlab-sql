import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Copy, Pause, Play, SkipBack, SkipForward, type LucideIcon } from 'lucide-react';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const inputCls =
  'h-10 w-full rounded-field border border-slate-200/90 bg-white/95 px-3.5 text-[14.5px] text-ink tabular-nums placeholder:text-ink-3 transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 shadow-xs';

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
  disabled,
}: {
  value: T;
  onChange: (val: T) => void;
  options: Array<{ value: T; label: string; sub?: string }>;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cx('relative inline-block w-full', className)}>
      <select
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value as unknown as T)}
        className="h-10 w-full appearance-none rounded-field border border-slate-200/90 bg-white/95 px-3.5 pr-10 text-[14.5px] font-medium text-slate-800 shadow-xs transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value} className="bg-white py-2 text-slate-800 font-medium">
            {opt.label} {opt.sub ? `(${opt.sub})` : ''}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
        <ChevronDown className="h-4 w-4" aria-hidden />
      </div>
    </div>
  );
}

export type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'indigo' | 'teal';

/* ---------- Surfaces ---------- */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx('rounded-card bg-white/90 backdrop-blur-xl shadow-card border border-slate-200/80 hover:border-blue-400/30 transition-all', className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  accessory,
}: {
  title: string;
  subtitle?: React.ReactNode;
  accessory?: React.ReactNode;
}) {
  return (
    <header className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-[26px] sm:text-[34px] font-bold leading-[1.15] tracking-[-0.025em] text-ink md:text-[40px]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-[64ch] text-[14.5px] sm:text-[16px] leading-relaxed text-ink-2">{subtitle}</p>}
      </div>
      {accessory && <div className="self-start md:self-auto">{accessory}</div>}
    </header>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cx('text-[17px] font-bold tracking-tight text-ink', className)}>{children}</h3>;
}

/* ---------- Controls ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'plain' | 'destructive';
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 font-semibold',
  secondary: 'bg-white text-ink hover:bg-slate-50 border border-slate-200 shadow-xs hover:border-slate-300 font-medium',
  plain: 'text-accent hover:bg-accent-soft font-semibold',
  destructive: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 shadow-xs font-semibold',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
}) {
  const iconOnly = !children;
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-[15px]',
        iconOnly ? (size === 'sm' ? 'w-8' : 'w-10') : size === 'sm' ? 'px-3.5' : 'px-5',
        BUTTON_VARIANTS[variant],
        className
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />}
      {children}
    </button>
  );
}

export interface SegOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: LucideIcon;
}

/** Apple-style segmented control with a sliding selection pill. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx('inline-flex max-w-full overflow-x-auto rounded-full bg-fill p-1 border border-line-soft/60 touch-scroll no-scrollbar', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors',
              size === 'sm' ? 'h-7 sm:h-8 px-2.5 sm:px-3 text-[12px] sm:text-[13px]' : 'h-8 sm:h-10 px-3 sm:px-4 text-[13px] sm:text-[14px]',
              active ? 'text-accent font-semibold' : 'text-ink-2 hover:text-ink'
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface shadow-card border border-line-soft/40"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {Icon && <Icon className={cx('h-3.5 w-3.5 sm:h-4 sm:w-4', active ? 'text-accent' : 'text-ink-2')} aria-hidden />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-2">{hint}</span>}
    </label>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14px] font-medium transition-all active:scale-[0.97]',
        active
          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-md shadow-blue-500/30 font-semibold'
          : 'bg-white/80 hover:bg-white text-ink-2 hover:text-accent shadow-xs border border-line-soft hover:border-blue-300',
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Display ---------- */

const TAG_TONES: Record<Tone, string> = {
  neutral: 'bg-fill text-ink-2 border border-line-soft font-medium',
  accent: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs',
  ok: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-xs',
  warn: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold shadow-xs',
  bad: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold shadow-xs',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs',
  teal: 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold shadow-xs',
};

export function Tag({
  tone = 'neutral',
  mono,
  children,
  className,
}: {
  tone?: Tone;
  mono?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium',
        mono && 'font-mono',
        TAG_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const NOTE_TONES: Record<Tone, { box: string; icon: string }> = {
  neutral: { box: 'bg-fill border border-line-soft', icon: 'text-ink-2' },
  accent: { box: 'bg-blue-50/70 border border-blue-200/80', icon: 'text-blue-600' },
  ok: { box: 'bg-emerald-50/70 border border-emerald-200/80', icon: 'text-emerald-600' },
  warn: { box: 'bg-amber-50/70 border border-amber-200/80', icon: 'text-amber-600' },
  bad: { box: 'bg-rose-50/70 border border-rose-200/80', icon: 'text-rose-600' },
  indigo: { box: 'bg-indigo-50/70 border border-indigo-200/80', icon: 'text-indigo-600' },
  teal: { box: 'bg-cyan-50/70 border border-cyan-200/80', icon: 'text-cyan-600' },
};

export function Note({
  tone = 'neutral',
  icon: Icon,
  title,
  children,
  className,
  role,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
  role?: string;
}) {
  const t = NOTE_TONES[tone];
  return (
    <div role={role} className={cx('flex gap-3 rounded-2xl p-4 text-[14px] leading-relaxed text-ink shadow-xs', t.box, className)}>
      {Icon && <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', t.icon)} aria-hidden />}
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5 text-ink-2' : ''}>{children}</div>
      </div>
    </div>
  );
}

const STAT_TONES: Record<Tone, string> = {
  neutral: 'text-ink',
  accent: 'text-blue-600',
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  bad: 'text-rose-600',
  indigo: 'text-indigo-600',
  teal: 'text-cyan-600',
};

const STAT_BOX: Record<Tone, string> = {
  neutral: 'bg-white/80 border-slate-200/80 shadow-xs',
  accent: 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border-blue-200/80 shadow-xs',
  ok: 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200/80 shadow-xs',
  warn: 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-200/80 shadow-xs',
  bad: 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border-rose-200/80 shadow-xs',
  indigo: 'bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 border-indigo-200/80 shadow-xs',
  teal: 'bg-gradient-to-br from-cyan-50/80 via-white to-cyan-50/30 border-cyan-200/80 shadow-xs',
};

export function Stat({
  label,
  value,
  tone = 'neutral',
  small,
}: {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  small?: boolean;
}) {
  return (
    <div className={cx('rounded-2xl p-3 sm:p-4 border transition-colors', STAT_BOX[tone])}>
      <div className="text-[12px] text-ink-2 font-medium">{label}</div>
      <div
        className={cx(
          'mt-1 font-display font-semibold tabular-nums tracking-tight',
          small ? 'text-[13px] sm:text-[14px] leading-snug' : 'text-[18px] sm:text-[22px] md:text-[24px]',
          STAT_TONES[tone]
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

/* ---------- Code ---------- */

const SQL_TOKEN =
  /('[^']*')|\b(CREATE|INDEX|ON|USING|WITH|EXTENSION|IF|NOT|EXISTS|SELECT|FROM|WHERE|AND|OR|ORDER|BY|LIMIT|BETWEEN|EXPLAIN|ANALYZE|DROP|SET|ASC|DESC|ARRAY|HASH|GIN|GIST|BRIN|SPGIST|BLOOM|BTREE|OFF|INSERT|INTO|VALUES|DELETE|MATERIALIZED|VIEW|REFRESH|CONCURRENTLY|DATA|NO|COUNT|SUM|AVG|MIN|MAX|AS|GROUP|HAVING|UNIQUE)\b/g;

function highlightLine(line: string): React.ReactNode[] {
  const ci = line.indexOf('--');
  const body = ci >= 0 ? line.slice(0, ci) : line;
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  SQL_TOKEN.lastIndex = 0;
  while ((m = SQL_TOKEN.exec(body))) {
    if (m.index > last) out.push(body.slice(last, m.index));
    out.push(
      <span key={k++} className={m[1] ? 'text-[#C41A16]' : 'font-semibold text-[#9B2393]'}>
        {m[0]}
      </span>
    );
    last = SQL_TOKEN.lastIndex;
  }
  out.push(body.slice(last));
  if (ci >= 0) {
    out.push(
      <span key="c" className="text-[#5D6C79] italic">
        {line.slice(ci)}
      </span>
    );
  }
  return out;
}

/** SQL block with Xcode-light syntax colors. */
export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={cx('overflow-x-auto rounded-2xl bg-fill p-4 font-mono text-[13px] leading-[1.7] text-ink border border-line-soft/80', className)}>
      <code>
        {code.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {highlightLine(line)}
            {'\n'}
          </React.Fragment>
        ))}
      </code>
    </pre>
  );
}

export function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context) */
    }
  };
  return (
    <Button size="sm" variant="plain" icon={copied ? Check : Copy} onClick={copy} aria-live="polite">
      {copied ? 'Tersalin' : label}
    </Button>
  );
}

/* ---------- Step player ---------- */

export function StepPlayer({
  total,
  index,
  onChange,
  isPlaying,
  onTogglePlay,
  title,
  explanation,
  idleTitle,
  idleText,
  children,
  className,
}: {
  total: number;
  index: number;
  onChange: (i: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  title?: string;
  explanation?: React.ReactNode;
  idleTitle: string;
  idleText: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const has = total > 0;
  return (
    <Card className={cx('p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-accent">
            {has ? `Langkah ${index + 1} dari ${total}` : 'Belum ada simulasi'}
          </p>
          <h3 className="mt-1 text-[17px] sm:text-[19px] font-semibold tracking-tight text-ink">{has ? title : idleTitle}</h3>
        </div>
        {has && (
          <div className="flex items-center gap-2">
            <Button
              aria-label="Langkah sebelumnya"
              icon={SkipBack}
              onClick={() => onChange(Math.max(0, index - 1))}
              disabled={index === 0}
            />
            {onTogglePlay && (
              <Button
                variant="primary"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
                icon={isPlaying ? Pause : Play}
                onClick={onTogglePlay}
              />
            )}
            <Button
              aria-label="Langkah berikutnya"
              icon={SkipForward}
              onClick={() => onChange(Math.min(total - 1, index + 1))}
              disabled={index >= total - 1}
            />
          </div>
        )}
      </div>

      {has && total > 1 && (
        <div className="mt-3 flex gap-1" role="group" aria-label="Lompat ke langkah">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              aria-label={`Langkah ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              className="group flex-1 py-2"
            >
              <span
                className={cx(
                  'block h-1.5 rounded-full transition-colors',
                  i <= index ? 'bg-accent' : 'bg-fill-strong group-hover:bg-line'
                )}
              />
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 text-[15px] leading-relaxed text-ink-2" aria-live="polite">
        {has ? explanation : idleText}
      </div>
      {children}
    </Card>
  );
}
