import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { MONO, SANS } from '../../ui/theme';

interface BloomVisualCanvasProps {
  filterCustomerId: string;
  filterStaffId: string;
  filterRating: string;
  targetMask: number[];
  activeBitIndices: number[];
}

export const BloomVisualCanvas: React.FC<BloomVisualCanvasProps> = ({
  filterCustomerId,
  filterStaffId,
  filterRating,
  targetMask,
  activeBitIndices,
}) => {
  const canvasWidth = 840;
  const canvasHeight = 250;
  const bitCount = 16;
  const bitWidth = 42;
  const bitGap = 8;
  const startX = 20;

  const cols = [
    { name: 'customer_id', val: filterCustomerId || '(semua)', active: Boolean(filterCustomerId), color: '#3B82F6' },
    { name: 'staff_id', val: filterStaffId ? `staff=${filterStaffId}` : '(semua)', active: Boolean(filterStaffId), color: '#8B5CF6' },
    { name: 'rating', val: filterRating ? `'${filterRating}'` : '(semua)', active: Boolean(filterRating), color: '#06B6D4' },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center lg:hidden">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-blue-600 border border-blue-200 shadow-xs">
          <ArrowRightLeft className="h-3 w-3" /> Geser horizontal untuk melihat bit array signature
        </span>
      </div>
      <div className="overflow-x-auto touch-scroll pb-2">
      <svg
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="mx-auto block select-none"
        role="img"
        aria-label="Visualisasi Arsitektur Hashing Bloom Filter Multi-Kolom"
      >
        <defs>
          <marker id="bloom-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#3B82F6" />
          </marker>
          <linearGradient id="grad-bit-on" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        <text x="24" y="20" fill="#475569" fontSize="11" fontWeight={700} fontFamily={SANS}>
          1. INPUT KOLOM QUERY (FLEKSIBEL · TIDAK TERIKAT LEADING COLUMN)
        </text>
        <text x="24" y="145" fill="#475569" fontSize="11" fontWeight={700} fontFamily={SANS}>
          2. HASIL 16-BIT QUERY SIGNATURE MASK (BITWISE LOGICAL AND CHECK)
        </text>

        {/* Input Column Nodes */}
        {cols.map((col, idx) => {
          const cx = 100 + idx * 260;
          return (
            <g key={col.name}>
              <rect
                x={cx - 80}
                y={32}
                width={160}
                height={50}
                rx={10}
                fill={col.active ? '#EFF6FF' : '#F8FAFC'}
                stroke={col.active ? col.color : '#CBD5E1'}
                strokeWidth={col.active ? 2 : 1}
                filter="drop-shadow(0 2px 4px rgba(15, 23, 42, 0.04))"
              />
              <text x={cx} y={52} textAnchor="middle" fill="#64748B" fontSize="10.5" fontWeight={600} fontFamily={MONO}>
                {col.name}
              </text>
              <text x={cx} y={70} textAnchor="middle" fill={col.active ? '#0F172A' : '#94A3B8'} fontSize="12" fontWeight={700} fontFamily={MONO}>
                {col.val}
              </text>
            </g>
          );
        })}

        {/* Dynamic Curved lines from active columns down to active bits */}
        {activeBitIndices.map((bitIdx) => {
          const targetX = startX + bitIdx * (bitWidth + bitGap) + bitWidth / 2;
          const targetY = 160;
          const sourceX = bitIdx < 5 ? 100 : bitIdx < 10 ? 360 : 620;

          return (
            <path
              key={`line-bit-${bitIdx}`}
              d={`M ${sourceX} 82 C ${sourceX} 125, ${targetX} 125, ${targetX} ${targetY - 5}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={2}
              markerEnd="url(#bloom-arrow)"
            />
          );
        })}

        {/* 16-Bit Array */}
        {targetMask.map((bit, idx) => {
          const bx = startX + idx * (bitWidth + bitGap);
          const by = 162;
          const isOn = bit === 1;

          return (
            <g key={idx}>
              <rect
                x={bx}
                y={by}
                width={bitWidth}
                height={46}
                rx={8}
                fill={isOn ? 'url(#grad-bit-on)' : '#F1F5F9'}
                stroke={isOn ? '#1D4ED8' : '#CBD5E1'}
                strokeWidth={isOn ? 2 : 1}
                filter={isOn ? 'drop-shadow(0 4px 8px rgba(37, 99, 235, 0.25))' : undefined}
              />
              <text
                x={bx + bitWidth / 2}
                y={by + 16}
                textAnchor="middle"
                fill={isOn ? '#93C5FD' : '#94A3B8'}
                fontSize="9"
                fontWeight={600}
                fontFamily={MONO}
              >
                b{idx}
              </text>
              <text
                x={bx + bitWidth / 2}
                y={by + 36}
                textAnchor="middle"
                fill={isOn ? '#FFFFFF' : '#334155'}
                fontSize="15"
                fontWeight={700}
                fontFamily={MONO}
              >
                {bit}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
};

