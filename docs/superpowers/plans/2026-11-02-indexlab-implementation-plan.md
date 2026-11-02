# IndexLab — Interactive Database Indexing Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build IndexLab, a local-first interactive educational web application for teaching PostgreSQL indexing methods (B-tree, Multicolumn B-tree, Hash, GIN, GiST, BRIN, SP-GiST, and Bloom) with dedicated algorithmic simulators, Index Comparison, Query Performance Lab, and SQL Explorer.

**Architecture:** Modular React + TypeScript single-page application powered by pure TypeScript algorithmic indexing engines (`src/engines/`) that emit step-by-step trace snapshots (`TraceStep[]`) rendered by dedicated SVG/Canvas interactive visualizers (`src/components/playground/`) and Recharts performance charts.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React, Vitest.

## Global Constraints

- Dark developer-tool theme by default (`#0B0F17` canvas, `#111827` surface panels, `#1E293B` borders, Emerald/Sky/Amber/Rose semantic accents).
- Every index method (B-tree, Multicolumn B-tree, Hash, GIN, GiST, BRIN, SP-GiST, Bloom) must have its own authentic data-structure visualization and working simulation algorithm — never reuse a generic tree for non-tree indexes.
- Clearly distinguish educational simulations from actual PostgreSQL C-engine execution (`Illustrative Algorithm Simulation`).
- Use DVD Rental schema (`film`, `rental`) in SQL examples and presets, matching the course PPT M10 – Indexing.

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/index.css`

- [ ] **Step 1: Create configuration files and install dependencies**
- [ ] **Step 2: Verify Vite + TypeScript setup compiles**

---

### Task 2: Domain Types, DVD Rental Dataset & 7+1 Index Metadata Catalog

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/indexCatalog.ts`

- [ ] **Step 1: Define core types for all 7+1 index methods, comparison metrics, SQL snippets, and performance lab scenarios**
- [ ] **Step 2: Populate comprehensive Indonesian educational metadata, operator matrices, trade-offs, and DVD Rental SQL examples**

---

### Task 3: B-Tree & Multicolumn B-Tree Engine + Unit Tests

**Files:**
- Create: `src/engines/btreeEngine.ts`
- Create: `src/engines/__tests__/btreeEngine.test.ts`

- [ ] **Step 1: Write unit tests for B+Tree insert (with node split), equality search, range scan across linked leaves, sorting, delete, and multicolumn leading-vs-non-leading search**
- [ ] **Step 2: Implement `btreeEngine.ts` and verify all tests pass (`npx vitest run`)**

---

### Task 4: Hash, GIN, GiST, BRIN, SP-GiST, and Bloom Engines + Unit Tests

**Files:**
- Create: `src/engines/otherIndexEngines.ts`
- Create: `src/engines/__tests__/otherIndexEngines.test.ts`

- [ ] **Step 1: Write unit tests for Hash bucket/collision engine, GIN inverted index engine, GiST 2D R-tree bounding-box engine, BRIN block min-max elimination engine, SP-GiST quadtree partitioning engine, and Bloom bit-array multi-hash filter engine**
- [ ] **Step 2: Implement `otherIndexEngines.ts` and verify all tests pass (`npx vitest run`)**

---

### Task 5: B-Tree Interactive Simulator & SVG Visualizer (Single & Multicolumn)

**Files:**
- Create: `src/components/playground/BTreeCanvas.tsx`
- Create: `src/components/playground/BTreeSimulator.tsx`

- [ ] **Step 1: Build custom SVG B+Tree canvas with hierarchical layout, multi-key node slots, parent-child pointers, horizontal leaf sibling pointers (`↔`), `ctid` tuple badges, and animated step highlights**
- [ ] **Step 2: Build B-Tree Simulator controls (Single-column vs Multicolumn toggle, Insert, Equality Search, Range Query `BETWEEN`, `ORDER BY` traversal, Delete, Preset loader, and Step-by-Step Trace Player)**

---

### Task 6: Dedicated Simulators for Hash, GIN, GiST, BRIN, SP-GiST, and Bloom

**Files:**
- Create: `src/components/playground/HashSimulator.tsx`
- Create: `src/components/playground/GinSimulator.tsx`
- Create: `src/components/playground/GistSimulator.tsx`
- Create: `src/components/playground/BrinSimulator.tsx`
- Create: `src/components/playground/SpGistSimulator.tsx`
- Create: `src/components/playground/BloomSimulator.tsx`
- Create: `src/components/playground/IndexPlaygroundView.tsx`

- [ ] **Step 1: Build Hash Simulator (hash function pipeline, bucket array, overflow collision chains, equality lookup)**
- [ ] **Step 2: Build GIN Simulator (document table + inverted index token dictionary + posting lists + `@>` / `&&` query intersection)**
- [ ] **Step 3: Build GiST Simulator (interactive 2D SVG coordinate plane with R-tree hierarchical Minimum Bounding Rectangles, box overlap `&&` and nearest-neighbor `<->`)**
- [ ] **Step 4: Build BRIN Simulator (physical disk pages/blocks with min-max summary ranges, Block Elimination visualizer, and physical correlation toggle)**
- [ ] **Step 5: Build SP-GiST Simulator (2D Quadtree recursive space partitioning NW/NE/SW/SE SVG visualizer with point/box search)**
- [ ] **Step 6: Build Bloom Simulator (bit array of 32 bits, multi-column hash functions `h1, h2`, bit-setting on insert, membership test with False Positive demonstration)**

---

### Task 7: Index Comparison, Query Performance Lab & SQL Explorer Modules

**Files:**
- Create: `src/components/comparison/IndexComparisonView.tsx`
- Create: `src/components/perflab/PerformanceLabView.tsx`
- Create: `src/components/sqlexplorer/SqlExplorerView.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Build `IndexComparisonView.tsx` (side-by-side comparison of any 2 index methods, operator compatibility table, conceptual radar/bar metrics, when to use vs avoid)**
- [ ] **Step 2: Build `PerformanceLabView.tsx` (interactive dataset & query selector, Seq Scan vs Index 1 vs Index 2 comparison, simulated `EXPLAIN ANALYZE` plan output, Recharts cost/rows/time charts)**
- [ ] **Step 3: Build `SqlExplorerView.tsx` (filterable SQL patterns for all 7+1 index types, `CREATE INDEX`, `DROP INDEX`, `EXPLAIN ANALYZE`, syntax highlighting, copy-to-clipboard)**
- [ ] **Step 4: Assemble `App.tsx` and run full verification (`npx vitest run` and `npm run build`)**

