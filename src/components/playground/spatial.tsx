import React from 'react';
import { SpatialPoint } from '../../engines/otherIndexEngines';
import { MONO, P, SANS } from '../../ui/theme';

export interface Box {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export const toX = (x: number) => x * 5;
export const toY = (y: number) => y * 3.4;

export function BoxSliders({ box, onChange }: { box: Box; onChange: (b: Box) => void }) {
  const items: Array<{ key: keyof Box; label: string; min: number; max: number; clamp: (v: number) => number }> = [
    { key: 'xMin', label: 'X min', min: 0, max: 75, clamp: (v) => Math.min(v, box.xMax - 5) },
    { key: 'xMax', label: 'X maks', min: 20, max: 100, clamp: (v) => Math.max(v, box.xMin + 5) },
    { key: 'yMin', label: 'Y min', min: 0, max: 75, clamp: (v) => Math.min(v, box.yMax - 5) },
    { key: 'yMax', label: 'Y maks', min: 20, max: 100, clamp: (v) => Math.max(v, box.yMin + 5) },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {items.map((it) => (
        <label key={it.key} className="block">
          <span className="flex justify-between text-[13px] text-ink-2">
            <span>{it.label}</span>
            <span className="font-mono tabular-nums text-ink">{box[it.key]}</span>
          </span>
          <input
            type="range"
            min={it.min}
            max={it.max}
            value={box[it.key]}
            onChange={(e) => onChange({ ...box, [it.key]: it.clamp(Number(e.target.value)) })}
            className="mt-2 w-full"
          />
        </label>
      ))}
    </div>
  );
}

/** Shared 2D plane: grid → custom regions (children) → query box → points. */
export function SpatialPlane({
  points,
  matched,
  box,
  label,
  children,
}: {
  points: SpatialPoint[];
  matched: Set<string>;
  box: Box;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 500 340" role="img" aria-label={label} className="w-full rounded-2xl bg-[#FBFBFD] ring-1 ring-line-soft">
      {[20, 40, 60, 80].map((g) => (
        <g key={g}>
          <line x1={toX(g)} y1={0} x2={toX(g)} y2={340} stroke={P.lineSoft} />
          <line x1={0} y1={toY(g)} x2={500} y2={toY(g)} stroke={P.lineSoft} />
        </g>
      ))}
      {children}
      <rect
        x={toX(box.xMin)}
        y={toY(box.yMin)}
        width={toX(box.xMax - box.xMin)}
        height={toY(box.yMax - box.yMin)}
        rx={4}
        fill={P.okFill}
        fillOpacity={0.1}
        stroke={P.okFill}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <text x={toX(box.xMin) + 6} y={toY(box.yMax) - 6} fill={P.ok} fontSize="11" fontWeight={600} fontFamily={SANS}>
        Area query
      </text>
      {points.map((pt) => {
        const hit = matched.has(pt.id);
        return (
          <g key={pt.id}>
            <circle cx={toX(pt.x)} cy={toY(pt.y)} r={hit ? 6.5 : 5} fill={hit ? P.okFill : P.ink} stroke="#FFFFFF" strokeWidth={2} />
            <text x={toX(pt.x) + 9} y={toY(pt.y) + 4} fill={hit ? P.ok : P.ink2} fontSize="11" fontWeight={500} fontFamily={MONO}>
              {pt.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

