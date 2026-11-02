import React from 'react';
import { motion } from 'framer-motion';
import { HashBucket, HashTraceStep } from '../../engines/otherIndexEngines';
import { MONO, P, SANS } from '../../ui/theme';

interface HashVisualCanvasProps {
  buckets: HashBucket[];
  currentStep: HashTraceStep | null;
  searchKey: string;
}

export const HashVisualCanvas: React.FC<HashVisualCanvasProps> = ({
  buckets,
  currentStep,
  searchKey,
}) => {
  const activeBucket = currentStep?.activeBucketIndex ?? null;
  const matchedKey = currentStep?.matchedEntryKey ?? null;

  const canvasWidth = 780;
  const rowHeight = 44;
  const startY = 32;
  const bucketWidth = 110;
  const nodeWidth = 140;
  const nodeHeight = 32;
  const canvasHeight = startY + buckets.length * rowHeight + 20;

  return (
    <div className="overflow-x-auto">
      <svg
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="mx-auto block select-none"
        role="img"
        aria-label="Visualisasi struktur Hash Index dan Overflow Chain"
      >
        <defs>
          <marker id="hash-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#3B82F6" />
          </marker>
          <marker id="hash-arrow-idle" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#94A3B8" />
          </marker>
          <linearGradient id="grad-active-bucket" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Column Headers */}
        <text x="24" y="18" fill="#64748B" fontSize="11" fontWeight={700} fontFamily={SANS}>
          BUCKET DIRECTORY (MOD 8)
        </text>
        <text x="180" y="18" fill="#64748B" fontSize="11" fontWeight={700} fontFamily={SANS}>
          CHAINED ENTRIES &amp; OVERFLOW POINTERS (HASH TUPLES)
        </text>

        {buckets.map((b) => {
          const y = startY + b.bucketIndex * rowHeight;
          const isActive = activeBucket === b.bucketIndex;
          const hasCollision = b.entries.length > 1;

          return (
            <g key={b.bucketIndex}>
              {/* Bucket directory slot */}
              <rect
                x={20}
                y={y}
                width={bucketWidth}
                height={nodeHeight}
                rx={8}
                fill={isActive ? 'url(#grad-active-bucket)' : '#F8FAFC'}
                stroke={isActive ? '#1D4ED8' : hasCollision ? '#F59E0B' : '#CBD5E1'}
                strokeWidth={isActive ? 2 : 1}
              />
              <text
                x={32}
                y={y + 20}
                fill={isActive ? '#FFFFFF' : '#0F172A'}
                fontSize="12"
                fontWeight={700}
                fontFamily={MONO}
              >
                Bucket #{b.bucketIndex}
              </text>

              {/* Arrow out of bucket */}
              <line
                x1={20 + bucketWidth}
                y1={y + nodeHeight / 2}
                x2={170}
                y2={y + nodeHeight / 2}
                stroke={isActive ? '#2563EB' : '#CBD5E1'}
                strokeWidth={isActive ? 2 : 1.25}
                markerEnd={isActive ? 'url(#hash-arrow)' : 'url(#hash-arrow-idle)'}
              />

              {/* Bucket Entries / Nodes */}
              {b.entries.length === 0 ? (
                <g>
                  <text x={180} y={y + 20} fill="#94A3B8" fontSize="11.5" fontFamily={MONO} fontStyle="italic">
                    [ NIL / Kosong ]
                  </text>
                </g>
              ) : (
                b.entries.map((entry, eIdx) => {
                  const nodeX = 180 + eIdx * (nodeWidth + 30);
                  const isMatch = matchedKey === entry.key;

                  return (
                    <g key={entry.key}>
                      {/* Connection arrow between nodes */}
                      {eIdx > 0 && (
                        <line
                          x1={nodeX - 30}
                          y1={y + nodeHeight / 2}
                          x2={nodeX}
                          y2={y + nodeHeight / 2}
                          stroke="#F59E0B"
                          strokeWidth={2}
                          markerEnd="url(#hash-arrow)"
                        />
                      )}

                      {/* Entry Box */}
                      <rect
                        x={nodeX}
                        y={y}
                        width={nodeWidth}
                        height={nodeHeight}
                        rx={8}
                        fill={isMatch ? '#10B981' : isActive ? '#EFF6FF' : '#FFFFFF'}
                        stroke={isMatch ? '#059669' : isActive ? '#3B82F6' : '#E2E8F0'}
                        strokeWidth={isMatch || isActive ? 2 : 1}
                        filter="drop-shadow(0 2px 4px rgba(15, 23, 42, 0.05))"
                      />
                      <text
                        x={nodeX + 10}
                        y={y + 16}
                        fill={isMatch ? '#FFFFFF' : '#0F172A'}
                        fontSize="11"
                        fontWeight={700}
                        fontFamily={MONO}
                      >
                        {entry.key}
                      </text>
                      <text
                        x={nodeX + 10}
                        y={y + 26}
                        fill={isMatch ? 'rgba(255,255,255,0.9)' : '#0284C7'}
                        fontSize="9.5"
                        fontWeight={600}
                        fontFamily={MONO}
                      >
                        ctid {entry.ctid}
                      </text>

                      {hasCollision && eIdx > 0 && (
                        <rect
                          x={nodeX + nodeWidth - 48}
                          y={y + 4}
                          width={42}
                          height={12}
                          rx={6}
                          fill="#FEF3C7"
                        />
                      )}
                      {hasCollision && eIdx > 0 && (
                        <text
                          x={nodeX + nodeWidth - 27}
                          y={y + 13}
                          textAnchor="middle"
                          fill="#D97706"
                          fontSize="8"
                          fontWeight={700}
                          fontFamily={SANS}
                        >
                          overflow
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

