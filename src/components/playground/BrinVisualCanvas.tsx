import React from 'react';
import { BrinBlock } from '../../engines/otherIndexEngines';
import { MONO, SANS } from '../../ui/theme';

interface BrinVisualCanvasProps {
  blocks: BrinBlock[];
  eliminatedBlocks: number[];
  scannedBlocks: number[];
  matchedCtids: string[];
  low: number;
  high: number;
}

export const BrinVisualCanvas: React.FC<BrinVisualCanvasProps> = ({
  blocks,
  eliminatedBlocks,
  scannedBlocks,
  matchedCtids,
  low,
  high,
}) => {
  const eliminatedSet = new Set(eliminatedBlocks);
  const matchedSet = new Set(matchedCtids);

  const canvasWidth = 840;
  const colWidth = 125;
  const gap = 12;
  const startX = 24;
  const canvasHeight = 270;

  return (
    <div className="overflow-x-auto">
      <svg
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="mx-auto block select-none"
        role="img"
        aria-label="Visualisasi BRIN Index Range Summary dan Block Elimination"
      >
        <defs>
          <linearGradient id="grad-brin-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>
          <linearGradient id="grad-brin-header" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Section labels */}
        <text x="24" y="20" fill="#475569" fontSize="11" fontWeight={700} fontFamily={SANS}>
          1. BRIN INDEX SUMMARY TUPLES [MIN .. MAX] (UKURAN SANGAT KECIL PADA RAM / DISK)
        </text>
        <text x="24" y="145" fill="#475569" fontSize="11" fontWeight={700} fontFamily={SANS}>
          2. PHYSICAL HEAP PAGE EXTENT (8KB DISK BLOCKS) &amp; RECHECK TUPLES
        </text>

        {blocks.map((blk, idx) => {
          const x = startX + idx * (colWidth + gap);
          const isEliminated = eliminatedSet.has(blk.blockNumber);

          return (
            <g key={blk.blockNumber}>
              {/* --- TOP: BRIN Summary Box --- */}
              <rect
                x={x}
                y={32}
                width={colWidth}
                height={64}
                rx={10}
                fill={isEliminated ? '#F8FAFC' : 'url(#grad-brin-scan)'}
                stroke={isEliminated ? '#CBD5E1' : '#2563EB'}
                strokeWidth={isEliminated ? 1 : 2}
                filter="drop-shadow(0 2px 4px rgba(15, 23, 42, 0.04))"
              />
              <text x={x + 10} y={50} fill={isEliminated ? '#64748B' : '#1D4ED8'} fontSize="10.5" fontWeight={700} fontFamily={MONO}>
                Range #{blk.blockNumber}
              </text>
              <text x={x + 10} y={68} fill="#0F172A" fontSize="12" fontWeight={700} fontFamily={MONO}>
                [{blk.minVal} .. {blk.maxVal}]
              </text>
              <rect
                x={x + 8}
                y={76}
                width={colWidth - 16}
                height={14}
                rx={4}
                fill={isEliminated ? '#ECFDF5' : '#FEF3C7'}
              />
              <text
                x={x + colWidth / 2}
                y={86}
                textAnchor="middle"
                fill={isEliminated ? '#059669' : '#D97706'}
                fontSize="9"
                fontWeight={700}
                fontFamily={SANS}
              >
                {isEliminated ? 'ELIMINASI (SKIP)' : 'INSPEKSI HEAP'}
              </text>

              {/* Connector line between summary and disk page */}
              <line
                x1={x + colWidth / 2}
                y1={98}
                x2={x + colWidth / 2}
                y2={155}
                stroke={isEliminated ? '#94A3B8' : '#2563EB'}
                strokeWidth={isEliminated ? 1 : 2}
                strokeDasharray={isEliminated ? '3 3' : undefined}
              />

              {/* --- BOTTOM: Physical Disk Page --- */}
              <rect
                x={x}
                y={156}
                width={colWidth}
                height={96}
                rx={10}
                fill={isEliminated ? '#F1F5F9' : '#FFFFFF'}
                stroke={isEliminated ? '#E2E8F0' : '#3B82F6'}
                strokeWidth={isEliminated ? 1 : 1.5}
                opacity={isEliminated ? 0.6 : 1}
              />
              <text x={x + 10} y={174} fill={isEliminated ? '#94A3B8' : '#0F172A'} fontSize="11" fontWeight={700} fontFamily={MONO}>
                Blok Disk #{blk.blockNumber}
              </text>

              {/* Rows inside disk page */}
              {blk.rows.map((row, rIdx) => {
                const ry = 184 + rIdx * 16;
                const isMatch = matchedSet.has(row.ctid);

                return (
                  <g key={row.ctid}>
                    <rect
                      x={x + 6}
                      y={ry - 10}
                      width={colWidth - 12}
                      height={14}
                      rx={3}
                      fill={isMatch ? '#10B981' : isEliminated ? 'transparent' : '#F8FAFC'}
                    />
                    <text
                      x={x + 10}
                      y={ry}
                      fill={isMatch ? '#FFFFFF' : isEliminated ? '#94A3B8' : '#334155'}
                      fontSize="9.5"
                      fontWeight={isMatch ? 700 : 500}
                      fontFamily={MONO}
                      textDecoration={isEliminated ? 'line-through' : undefined}
                    >
                      id={row.value}
                    </text>
                    <text
                      x={x + colWidth - 10}
                      y={ry}
                      textAnchor="end"
                      fill={isMatch ? '#FFFFFF' : '#0284C7'}
                      fontSize="9"
                      fontWeight={isMatch ? 700 : 500}
                      fontFamily={MONO}
                    >
                      {row.ctid}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
