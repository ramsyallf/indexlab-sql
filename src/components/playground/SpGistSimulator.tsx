import React, { useState } from 'react';
import { Grid, Plus, RotateCcw } from 'lucide-react';
import {
  buildSpGistQuadTree,
  PRESET_SPATIAL_POINTS,
  QuadTreeNode,
  searchSpGistQuadTree,
  SpatialPoint,
} from '../../engines/otherIndexEngines';
import { Button, Card, Field, inputCls, Segmented } from '../ui/primitives';
import { Box, BoxSliders, SpatialPlane, toX, toY } from './spatial';
import { MONO, P, SANS } from '../../ui/theme';

export const SpGistSimulator: React.FC = () => {
  const [points, setPoints] = useState<SpatialPoint[]>(PRESET_SPATIAL_POINTS);
  const [capacity, setCapacity] = useState<number>(2);
  const [box, setBox] = useState<Box>({
    xMin: 8,
    yMin: 12,
    xMax: 42,
    yMax: 45,
  });
  const [newX, setNewX] = useState('22');
  const [newY, setNewY] = useState('30');

  const quadTree = buildSpGistQuadTree(points, capacity);
  const searchRes = searchSpGistQuadTree(quadTree, box);
  const matched = new Set(searchRes.matchedPoints.map((p) => p.id));
  const visitedQuadSet = new Set(searchRes.steps.map((s) => s.activeQuadrantId));

  const quadRects: QuadTreeNode[] = [];
  function collectQuads(n: QuadTreeNode) {
    quadRects.push(n);
    n.children.forEach(collectQuads);
  }
  collectQuads(quadTree);

  const addPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const x = Math.max(4, Math.min(96, Number(newX) || 25));
    const y = Math.max(4, Math.min(96, Number(newY) || 25));
    const nextIdx = points.length + 1;
    setPoints([
      ...points,
      {
        id: `P${nextIdx}`,
        label: `Node #${nextIdx} (${x},${y})`,
        x,
        y,
        ctid: `(4,${nextIdx})`,
      },
    ]);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-ink-2">Kapasitas Titik/Kuadran</span>
            <Segmented<number>
              size="sm"
              ariaLabel="Kapasitas kuadran"
              value={capacity}
              onChange={setCapacity}
              options={[
                { value: 1, label: '1 Titik (Split Dalam)' },
                { value: 2, label: '2 Titik (Default)' },
                { value: 3, label: '3 Titik' },
              ]}
            />
          </div>
          <span className="text-[13px] text-ink-2">Partisi ruang NW/NE/SW/SE tanpa tumpang-tindih</span>
        </div>

        <div className="mt-5 border-t border-line-soft pt-5">
          <BoxSliders box={box} onChange={setBox} />
          <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-ink-2">
            <span className="mr-2 select-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">SQL</span>
            SELECT * FROM customer_map WHERE location_point &lt;@ box '(({box.xMin},{box.yMin}),({box.xMax},{box.yMax}))';
          </p>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* 2D Quadtree Canvas */}
        <Card className="p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink">
              <Grid className="h-4 w-4 text-accent" />
              Peta Partisi Ruang Quadtree
            </h3>
            <span className="text-[13px] text-ink-2">Sel kuadran saling lepas (disjoint)</span>
          </div>

          <SpatialPlane points={points} matched={matched} box={box} label="Peta spasial SP-GiST">
            {quadRects
              .filter((q) => q.isLeaf)
              .map((q) => {
                const isVisited = visitedQuadSet.has(q.id);
                return (
                  <g key={q.id}>
                    <rect
                      x={toX(q.xMin)}
                      y={toY(q.yMin)}
                      width={toX(q.xMax - q.xMin)}
                      height={toY(q.yMax - q.yMin)}
                      fill={isVisited ? P.accent : 'none'}
                      fillOpacity={isVisited ? 0.08 : 0}
                      stroke={isVisited ? P.accent : P.line}
                      strokeWidth={isVisited ? 1.75 : 1}
                    />
                    <text
                      x={toX(q.xMin) + 6}
                      y={toY(q.yMin) + 14}
                      fill={isVisited ? P.accent : P.ink3}
                      fontSize="10"
                      fontFamily={MONO}
                      fontWeight={isVisited ? 600 : 400}
                    >
                      {q.id}
                    </text>
                  </g>
                );
              })}
          </SpatialPlane>

          <form onSubmit={addPoint} className="mt-5 flex flex-wrap items-end gap-2.5 sm:gap-3 border-t border-line-soft pt-5">
            <Field label="X" className="w-20 sm:w-24">
              <input
                type="number"
                value={newX}
                onChange={(e) => setNewX(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Y" className="w-20 sm:w-24">
              <input
                type="number"
                value={newY}
                onChange={(e) => setNewY(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Button type="submit" icon={Plus}>
              Tambah Titik
            </Button>
            <Button variant="plain" icon={RotateCcw} onClick={() => setPoints(PRESET_SPATIAL_POINTS)}>
              Reset
            </Button>
          </form>
        </Card>

        {/* Partition Log */}
        <Card className="flex flex-col p-5 sm:p-6 lg:col-span-5">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink">
            Jalur Partisi ({searchRes.steps.length} Langkah)
          </h3>
          <ol className="mt-4 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
            {searchRes.steps.map((s) => (
              <li key={s.stepIndex} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fill text-[12px] font-semibold text-ink">
                  {s.stepIndex}
                </span>
                <div className="flex-1 min-w-0">
                  <strong className="text-ink">{s.title}</strong>
                  <p className="mt-0.5 text-[13px]">{s.explanation}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
};
