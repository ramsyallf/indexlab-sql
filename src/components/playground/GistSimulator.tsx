import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { buildGistRTree, PRESET_SPATIAL_POINTS, searchGistBoxOverlap, SpatialPoint } from '../../engines/otherIndexEngines';
import { Button, Card, cx, Field, inputCls, Tag } from '../ui/primitives';
import { Box, BoxSliders, SpatialPlane, toX, toY } from './spatial';
import { P, SANS } from '../../ui/theme';

export const GistSimulator: React.FC = () => {
  const [points, setPoints] = useState<SpatialPoint[]>(PRESET_SPATIAL_POINTS);
  const [box, setBox] = useState<Box>({ xMin: 10, yMin: 15, xMax: 45, yMax: 45 });
  const [newX, setNewX] = useState('48');
  const [newY, setNewY] = useState('32');

  const mbrs = buildGistRTree(points);
  const res = searchGistBoxOverlap(mbrs, box);
  const matched = new Set(res.matchedPoints.map((p) => p.id));
  const pruned = new Set(res.steps[0]?.prunedBoxIds ?? []);

  const addPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const x = Math.max(5, Math.min(95, Number(newX) || 50));
    const y = Math.max(5, Math.min(95, Number(newY) || 50));
    const n = points.length + 1;
    setPoints([...points, { id: `P${n}`, label: `Store #${n}`, x, y, ctid: `(3,${n})` }]);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink">Area pencarian</h3>
          <span className="font-mono text-[12.5px] text-ink-2">
            <span className="mr-2 select-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">SQL</span>
            WHERE coordinates &amp;&amp; box '(({box.xMin},{box.yMin}),({box.xMax},{box.yMax}))'
          </span>
        </div>
        <BoxSliders box={box} onChange={setBox} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[17px] font-semibold tracking-tight">Simulasi konseptual GiST dengan R-Tree / MBR</h3>
            <span className="text-[13px] text-ink-2">MBR boleh tumpang-tindih</span>
          </div>
          <SpatialPlane points={points} matched={matched} box={box} label="Peta spasial GiST">
            {mbrs.map((m) => {
              const off = pruned.has(m.id);
              return (
                <g key={m.id}>
                  <rect
                    x={toX(m.xMin)}
                    y={toY(m.yMin)}
                    width={toX(m.xMax - m.xMin)}
                    height={toY(m.yMax - m.yMin)}
                    rx={6}
                    fill={off ? 'none' : P.accent}
                    fillOpacity={0.06}
                    stroke={off ? P.line : P.accent}
                    strokeWidth={off ? 1.25 : 1.75}
                    strokeDasharray={off ? '4 4' : undefined}
                  />
                  <text x={toX(m.xMin) + 7} y={toY(m.yMin) + 15} fill={off ? P.ink2 : P.accent} fontSize="11" fontWeight={600} fontFamily={SANS}>
                    {m.id} · {off ? 'dipangkas' : 'diperiksa'}
                  </text>
                </g>
              );
            })}
          </SpatialPlane>

          <form onSubmit={addPoint} className="mt-5 flex flex-wrap items-end gap-2.5 sm:gap-3 border-t border-line-soft pt-5">
            <Field label="X" className="w-20 sm:w-24">
              <input type="number" value={newX} onChange={(e) => setNewX(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Y" className="w-20 sm:w-24">
              <input type="number" value={newY} onChange={(e) => setNewY(e.target.value)} className={inputCls} />
            </Field>
            <Button type="submit" icon={Plus}>
              Tambah titik
            </Button>
            <Button variant="plain" icon={RotateCcw} onClick={() => setPoints(PRESET_SPATIAL_POINTS)}>
              Reset
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6 lg:col-span-5">
          <h3 className="text-[17px] font-semibold tracking-tight">Node R-Tree</h3>
          <ul className="mt-4 space-y-2">
            {mbrs.map((m) => {
              const off = pruned.has(m.id);
              return (
                <li key={m.id} className={cx('rounded-2xl p-3.5', off ? 'bg-fill' : 'bg-accent-soft')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cx('text-[14px] font-semibold', off && 'text-ink-2')}>{m.label}</span>
                    <Tag tone={off ? 'neutral' : 'accent'} className={off ? 'bg-surface' : 'bg-surface'}>
                      {off ? 'Dipangkas' : 'Diperiksa'}
                    </Tag>
                  </div>
                  <p className="mt-1 font-mono text-[12px] text-ink-2">
                    ({m.xMin},{m.yMin}) → ({m.xMax},{m.yMax})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.points.map((p) => (
                      <Tag key={p.id} mono tone={matched.has(p.id) ? 'ok' : 'neutral'} className={matched.has(p.id) ? '' : 'bg-surface'}>
                        {p.id} {p.ctid}
                      </Tag>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <ol className="mt-5 space-y-3 border-t border-line-soft pt-5">
            {res.steps.map((s) => (
              <li key={s.stepIndex} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fill text-[12px] font-semibold text-ink">
                  {s.stepIndex}
                </span>
                <span>{s.explanation}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
};
