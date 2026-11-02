import React from 'react';
import { GinDocument, GinPostingEntry } from '../../engines/otherIndexEngines';
import { MONO, SANS } from '../../ui/theme';

interface GinVisualCanvasProps {
  inverted: GinPostingEntry[];
  docs: GinDocument[];
  queriedTokens: string[];
  operator: '@>' | '&&';
  matchedDocIds: number[];
}

export const GinVisualCanvas: React.FC<GinVisualCanvasProps> = ({
  inverted,
  docs,
  queriedTokens,
  operator,
  matchedDocIds,
}) => {
  const matchedSet = new Set(matchedDocIds);
  const queriedSet = new Set(queriedTokens);

  const canvasWidth = 840;
  const leftX = 30;
  const tokenWidth = 140;
  const rightX = 520;
  const docWidth = 280;
  const itemHeight = 36;
  const gapY = 16;
  const startY = 50;

  const totalHeight = Math.max(
    startY + inverted.length * (itemHeight + gapY) + 30,
    startY + docs.length * (itemHeight + gapY) + 30
  );

  return (
    <div className="overflow-x-auto">
      <svg
        width={canvasWidth}
        height={totalHeight}
        viewBox={`0 0 ${canvasWidth} ${totalHeight}`}
        className="mx-auto block select-none"
        role="img"
        aria-label="Visualisasi Arsitektur Inverted Index (GIN)"
      >
        <defs>
          <marker id="gin-arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#10B981" />
          </marker>
          <marker id="gin-arrow-idle" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#CBD5E1" />
          </marker>
          <linearGradient id="grad-token-active" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Section Headers */}
        <text x={leftX} y={28} fill="#475569" fontSize="11" fontWeight={700} fontFamily={SANS}>
          LEXICON / ENTRY TREE (UNIQUE TOKENS)
        </text>
        <text x="320" y={28} fill="#64748B" fontSize="10.5" fontWeight={600} fontFamily={MONO}>
          POSTING POINTERS ({operator === '@>' ? 'BITMAP AND' : 'BITMAP OR'})
        </text>
        <text x={rightX} y={28} fill="#475569" fontSize="11" fontWeight={700} fontFamily={SANS}>
          TABLE HEAP TUPLES (POSTING LIST TARGETS)
        </text>

        {/* Dynamic Curved Connections between Queried Tokens and Documents */}
        {inverted.map((entry, tIdx) => {
          const isQueried = queriedSet.has(entry.token);
          const tokenY = startY + tIdx * (itemHeight + gapY) + itemHeight / 2;

          return entry.docIds.map((docId: number) => {
            const dIdx = docs.findIndex((d) => d.docId === docId);
            if (dIdx < 0) return null;

            const docY = startY + dIdx * (itemHeight + gapY) + itemHeight / 2;
            const isMatchDoc = matchedSet.has(docId);
            const isActivePath = isQueried && isMatchDoc;

            return (
              <path
                key={`path-${entry.token}-${docId}`}
                d={`M ${leftX + tokenWidth} ${tokenY} C ${leftX + tokenWidth + 120} ${tokenY}, ${rightX - 120} ${docY}, ${rightX - 6} ${docY}`}
                fill="none"
                stroke={isActivePath ? '#10B981' : isQueried ? '#93C5FD' : '#E2E8F0'}
                strokeWidth={isActivePath ? 2.5 : isQueried ? 1.5 : 1}
                strokeDasharray={isQueried ? undefined : '3 3'}
                markerEnd={isActivePath ? 'url(#gin-arrow-active)' : 'url(#gin-arrow-idle)'}
              />
            );
          });
        })}

        {/* Tokens List (Left Column) */}
        {inverted.map((entry, idx) => {
          const y = startY + idx * (itemHeight + gapY);
          const isQueried = queriedSet.has(entry.token);

          return (
            <g key={entry.token}>
              <rect
                x={leftX}
                y={y}
                width={tokenWidth}
                height={itemHeight}
                rx={10}
                fill={isQueried ? 'url(#grad-token-active)' : '#F8FAFC'}
                stroke={isQueried ? '#1D4ED8' : '#CBD5E1'}
                strokeWidth={isQueried ? 2 : 1}
                filter="drop-shadow(0 2px 4px rgba(15, 23, 42, 0.04))"
              />
              <text
                x={leftX + 12}
                y={y + 22}
                fill={isQueried ? '#FFFFFF' : '#0F172A'}
                fontSize="12.5"
                fontWeight={700}
                fontFamily={MONO}
              >
                '{entry.token}'
              </text>
              <rect
                x={leftX + tokenWidth - 30}
                y={y + 8}
                width={20}
                height={20}
                rx={10}
                fill={isQueried ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}
              />
              <text
                x={leftX + tokenWidth - 20}
                y={y + 22}
                textAnchor="middle"
                fill={isQueried ? '#FFFFFF' : '#475569'}
                fontSize="10"
                fontWeight={700}
                fontFamily={MONO}
              >
                {entry.docIds.length}
              </text>
            </g>
          );
        })}

        {/* Documents List (Right Column) */}
        {docs.map((doc, idx) => {
          const y = startY + idx * (itemHeight + gapY);
          const isHit = matchedSet.has(doc.docId);

          return (
            <g key={doc.docId}>
              <rect
                x={rightX}
                y={y}
                width={docWidth}
                height={itemHeight}
                rx={10}
                fill={isHit ? '#ECFDF5' : '#FFFFFF'}
                stroke={isHit ? '#10B981' : '#E2E8F0'}
                strokeWidth={isHit ? 2 : 1}
                filter="drop-shadow(0 2px 4px rgba(15, 23, 42, 0.04))"
              />
              <text
                x={rightX + 12}
                y={y + 23}
                fill={isHit ? '#065F46' : '#1E293B'}
                fontSize="12"
                fontWeight={700}
                fontFamily={SANS}
              >
                #{doc.docId} {doc.title}
              </text>
              <text
                x={rightX + docWidth - 12}
                y={y + 23}
                textAnchor="end"
                fill={isHit ? '#059669' : '#0284C7'}
                fontSize="11"
                fontWeight={600}
                fontFamily={MONO}
              >
                ctid {doc.ctid}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
