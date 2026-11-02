import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BTreeNode, BTreeTraceStep, formatEntryLabel } from '../../engines/btreeEngine';
import { LegendDot } from '../ui/primitives';
import { MONO, P, SANS } from '../../ui/theme';

interface BTreeCanvasProps {
  root: BTreeNode;
  currentStep: BTreeTraceStep | null;
  isMulticolumn: boolean;
}

interface PositionedNode {
  node: BTreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

interface Edge {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const BTreeCanvas: React.FC<BTreeCanvasProps> = ({ root, currentStep, isMulticolumn }) => {
  const displayRoot = currentStep ? currentStep.treeSnapshot : root;

  const layout = useMemo(() => {
    const positioned = new Map<string, PositionedNode>();
    const edges: Edge[] = [];

    const slotWidth = isMulticolumn ? 76 : 54;
    const minNodeWidth = isMulticolumn ? 140 : 116;
    const nodeHeight = 72;
    const levelGapY = 128;
    const siblingGapX = 28;

    const getNodeWidth = (n: BTreeNode) =>
      Math.max(minNodeWidth, Math.max(1, n.isLeaf ? n.entries.length : n.keys.length) * slotWidth + 24);

    const subtreeWidths = new Map<string, number>();
    function measure(n: BTreeNode): number {
      const own = getNodeWidth(n);
      if (n.isLeaf || n.children.length === 0) {
        subtreeWidths.set(n.id, own);
        return own;
      }
      const kids = n.children.reduce((a, c) => a + measure(c), 0) + siblingGapX * (n.children.length - 1);
      const w = Math.max(own, kids);
      subtreeWidths.set(n.id, w);
      return w;
    }

    const totalTreeWidth = measure(displayRoot);
    const canvasWidth = Math.max(860, totalTreeWidth + 80);
    let maxDepth = 0;

    function place(n: BTreeNode, leftX: number, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      const subW = subtreeWidths.get(n.id) ?? minNodeWidth;
      const ownW = getNodeWidth(n);
      const centerX = leftX + subW / 2;
      const y = 24 + depth * levelGapY;
      positioned.set(n.id, { node: n, x: centerX - ownW / 2, y, width: ownW, height: nodeHeight, depth });

      if (!n.isLeaf && n.children.length > 0) {
        const span =
          n.children.reduce((a, c) => a + (subtreeWidths.get(c.id) ?? minNodeWidth), 0) +
          siblingGapX * (n.children.length - 1);
        let childLeft = centerX - span / 2;
        n.children.forEach((child, idx) => {
          const cw = subtreeWidths.get(child.id) ?? minNodeWidth;
          place(child, childLeft, depth + 1);
          const cp = positioned.get(child.id)!;
          edges.push({
            id: `edge-${n.id}-${child.id}`,
            fromId: n.id,
            toId: child.id,
            x1: centerX - ownW / 2 + ((idx + 0.5) / n.children.length) * ownW,
            y1: y + nodeHeight,
            x2: cp.x + cp.width / 2,
            y2: cp.y,
          });
          childLeft += cw + siblingGapX;
        });
      }
    }
    place(displayRoot, (canvasWidth - totalTreeWidth) / 2, 0);

    const leafLinks: Edge[] = [];
    positioned.forEach((pos) => {
      if (pos.node.isLeaf && pos.node.nextLeafId) {
        const next = positioned.get(pos.node.nextLeafId);
        if (next) {
          leafLinks.push({
            id: `leaf-${pos.node.id}-${next.node.id}`,
            fromId: pos.node.id,
            toId: next.node.id,
            x1: pos.x + pos.width,
            y1: pos.y + pos.height / 2,
            x2: next.x,
            y2: next.y + next.height / 2,
          });
        }
      }
    });

    return {
      positioned: Array.from(positioned.values()),
      edges,
      leafLinks,
      canvasWidth,
      canvasHeight: Math.max(300, (maxDepth + 1) * levelGapY + 20),
    };
  }, [displayRoot, isMulticolumn]);

  const activeNodeId = currentStep?.activeNodeId ?? null;
  const visited = new Set(currentStep?.visitedNodeIds ?? []);
  const matchedNodes = new Set(currentStep?.matchedNodeIds ?? []);
  const matchedKeys = new Set(currentStep?.matchedEntryKeys ?? []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-2">
        <LegendDot color={P.accent} label="Sedang diperiksa" />
        <LegendDot color={P.okFill} label="Cocok" />
        <LegendDot color={P.warnFill} label="Sibling right-link aktif" />
        <LegendDot color={P.teal} label="Heap Tuple ID (ctid)" />
        <span className="ml-auto font-mono text-[12px] text-ink-3">nbtree · Lehman–Yao B-link tree</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={layout.canvasWidth}
          height={layout.canvasHeight}
          viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
          className="mx-auto block select-none"
          role="img"
          aria-label="Visualisasi struktur Lehman–Yao B-link tree (PostgreSQL nbtree)"
        >
          <defs>
            <linearGradient id="grad-root-bar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="grad-internal-bar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
            <linearGradient id="grad-leaf-bar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
            <linearGradient id="grad-hit" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="grad-active-node" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EFF6FF" />
              <stop offset="100%" stopColor="#DBEAFE" />
            </linearGradient>
            {[
              ['arrow-default', '#64748B'],
              ['arrow-active', '#2563EB'],
              ['arrow-sibling', '#F59E0B'],
            ].map(([id, color]) => (
              <marker key={id} id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill={color} />
              </marker>
            ))}
          </defs>

          {layout.edges.map((e) => {
            const on = visited.has(e.fromId) && visited.has(e.toId);
            const midY = (e.y1 + e.y2) / 2;
            return (
              <path
                key={e.id}
                d={`M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2 - 2}`}
                fill="none"
                stroke={on ? '#2563EB' : '#94A3B8'}
                strokeWidth={on ? 2.5 : 1.5}
                markerEnd={on ? 'url(#arrow-active)' : 'url(#arrow-default)'}
              />
            );
          })}

          {layout.leafLinks.map((l) => {
            const on =
              (currentStep?.horizontalLinkFromId === l.fromId && currentStep?.horizontalLinkToId === l.toId) ||
              (currentStep?.horizontalLinkFromId === l.toId && currentStep?.horizontalLinkToId === l.fromId);
            return (
              <line
                key={l.id}
                x1={l.x1 + 2}
                y1={l.y1}
                x2={l.x2 - 4}
                y2={l.y2}
                stroke="#F59E0B"
                strokeOpacity={on ? 1 : 0.6}
                strokeWidth={on ? 3 : 1.75}
                strokeDasharray={on ? undefined : '5 3'}
                markerEnd="url(#arrow-sibling)"
              />
            );
          })}

          {layout.positioned.map(({ node, x, y, width, height, depth }) => {
            const isActive = activeNodeId === node.id;
            const isMatched = matchedNodes.has(node.id);
            const isVisited = visited.has(node.id);

            const isRoot = depth === 0 && !node.isLeaf;
            const role = isRoot ? 'Root' : node.isLeaf ? 'Leaf' : 'Internal';

            // Web3 vibrant card styling
            const nodeFill = isActive
              ? 'url(#grad-active-node)'
              : isMatched
              ? '#ECFDF5'
              : '#FFFFFF';

            const nodeStroke = isActive
              ? '#2563EB'
              : isMatched
              ? '#10B981'
              : isRoot
              ? '#3B82F6'
              : node.isLeaf
              ? '#10B981'
              : '#8B5CF6';

            const headerGrad = isRoot
              ? 'url(#grad-root-bar)'
              : node.isLeaf
              ? 'url(#grad-leaf-bar)'
              : 'url(#grad-internal-bar)';

            const slots = node.isLeaf
              ? node.entries.map((e) => ({ label: e.label, sub: e.ctid }))
              : node.keys.map((k, i) => ({ label: formatEntryLabel(k, node.secondaryKeys?.[i]), sub: `sep ${i + 1}` }));
            const slotW = (width - 16) / Math.max(1, slots.length);

            return (
              <motion.g key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                {/* Node Box */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={14}
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  filter="drop-shadow(0 4px 12px rgba(15, 23, 42, 0.06))"
                />

                {/* Web3 Gradient Header Accent Pill */}
                <rect
                  x={x + 7}
                  y={y + 5}
                  width={role === 'Internal' ? 52 : 40}
                  height={15}
                  rx={7.5}
                  fill={headerGrad}
                />
                <text
                  x={x + 7 + (role === 'Internal' ? 26 : 20)}
                  y={y + 16}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight={700}
                  fontFamily={SANS}
                >
                  {role}
                </text>

                <text x={x + width - 10} y={y + 16} textAnchor="end" fill="#64748B" fontSize="9.5" fontWeight={600} fontFamily={MONO}>
                  {node.id}
                </text>

                {slots.length === 0 ? (
                  <text x={x + width / 2} y={y + 46} textAnchor="middle" fill="#64748B" fontSize="12" fontFamily={SANS}>
                    Kosong
                  </text>
                ) : (
                  slots.map((s, i) => {
                    const sx = x + 8 + i * slotW;
                    const sy = y + 24;
                    const sw = slotW - 4;
                    const hit = matchedKeys.has(s.label);
                    return (
                      <g key={`${node.id}-${i}`}>
                        <rect
                          x={sx}
                          y={sy}
                          width={sw}
                          height={40}
                          rx={9}
                          fill={hit ? 'url(#grad-hit)' : '#F8FAFC'}
                          stroke={hit ? 'none' : '#CBD5E1'}
                          strokeWidth={1}
                        />
                        <text
                          x={sx + sw / 2}
                          y={sy + 18}
                          textAnchor="middle"
                          fill={hit ? '#FFFFFF' : '#0F172A'}
                          fontSize={isMulticolumn ? 11.5 : 13}
                          fontWeight={700}
                          fontFamily={MONO}
                        >
                          {s.label}
                        </text>
                        <text
                          x={sx + sw / 2}
                          y={sy + 32}
                          textAnchor="middle"
                          fill={hit ? 'rgba(255,255,255,0.95)' : node.isLeaf ? '#0284C7' : '#64748B'}
                          fontSize="9.5"
                          fontWeight={node.isLeaf ? 700 : 500}
                          fontFamily={MONO}
                        >
                          {s.sub}
                        </text>
                      </g>
                    );
                  })
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
