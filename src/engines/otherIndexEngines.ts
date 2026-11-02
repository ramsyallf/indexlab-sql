import { IndexTypeId, PerfScenario, SimulatedPlanResult } from '../types';

/* ============================================================================
 * 1. HASH INDEX ENGINE
 * ========================================================================== */

export interface HashEntry {
  key: string;
  hashHex: string;
  bucketIndex: number;
  ctid: string;
  rowInfo: string;
}

export interface HashBucket {
  bucketIndex: number;
  entries: HashEntry[]; // index 0 = primary slot, index >= 1 = collision overflow chain
}

export interface HashTraceStep {
  stepIndex: number;
  title: string;
  explanation: string;
  computedHashHex?: string;
  activeBucketIndex: number | null;
  checkedEntryIndex: number | null;
  matchedEntryKey: string | null;
  isCollisionWalk: boolean;
}

export function computePostgresStyleHash(input: string, bucketCount: number = 8): {
  rawHash: number;
  hashHex: string;
  bucketIndex: number;
} {
  let h = 2166136261;
  const normalized = input.trim();
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unsigned = h >>> 0;
  const hashHex = '0x' + unsigned.toString(16).toUpperCase().padStart(8, '0');
  const bucketIndex = unsigned % bucketCount;
  return { rawHash: unsigned, hashHex, bucketIndex };
}

export const PRESET_HASH_ITEMS: Array<{ key: string; ctid: string; rowInfo: string }> = [
  { key: 'G', ctid: '(0,1)', rowInfo: 'film_id=1 · ACADEMY DINOSAUR · rating=G' },
  { key: 'PG', ctid: '(0,2)', rowInfo: 'film_id=6 · AGENT TRUMAN · rating=PG' },
  { key: 'PG-13', ctid: '(0,4)', rowInfo: 'film_id=19 · AMADEUS HOLY · rating=PG-13' },
  { key: 'R', ctid: '(1,2)', rowInfo: 'film_id=24 · ANALYZE HOOSIERS · rating=R' },
  { key: 'NC-17', ctid: '(1,5)', rowInfo: 'film_id=3 · ADAPTATION HOLES · rating=NC-17' },
  { key: 'FLM-102', ctid: '(2,1)', rowInfo: 'film_id=102 · BUBBLE GROSSE · code=FLM-102' },
  { key: 'FLM-205', ctid: '(2,6)', rowInfo: 'film_id=205 · DANCES NONE · code=FLM-205' },
  { key: 'FLM-318', ctid: '(3,3)', rowInfo: 'film_id=318 · HAROLD HILLS · code=FLM-318' },
];

export function buildHashBuckets(
  items: Array<{ key: string; ctid: string; rowInfo: string }>,
  bucketCount: number = 8
): HashBucket[] {
  const buckets: HashBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    bucketIndex: i,
    entries: [],
  }));
  for (const item of items) {
    const { hashHex, bucketIndex } = computePostgresStyleHash(item.key, bucketCount);
    const exists = buckets[bucketIndex].entries.findIndex((e) => e.key === item.key);
    const entry: HashEntry = {
      key: item.key,
      hashHex,
      bucketIndex,
      ctid: item.ctid,
      rowInfo: item.rowInfo,
    };
    if (exists !== -1) {
      buckets[bucketIndex].entries[exists] = entry;
    } else {
      buckets[bucketIndex].entries.push(entry);
    }
  }
  return buckets;
}

export function searchHashIndex(
  buckets: HashBucket[],
  searchKey: string
): {
  steps: HashTraceStep[];
  found: HashEntry | null;
} {
  const bucketCount = buckets.length;
  const { hashHex, bucketIndex } = computePostgresStyleHash(searchKey, bucketCount);
  const steps: HashTraceStep[] = [];

  steps.push({
    stepIndex: 1,
    title: `Hitung Hash Function h("${searchKey}")`,
    explanation: `Nilai "${searchKey}" diproses oleh fungsi hash 32-bit menghasilkan kode ${hashHex}. Operasi modulo (${hashHex} mod ${bucketCount}) mengarahkan pencarian langsung ke Bucket #${bucketIndex} dalam waktu O(1).`,
    computedHashHex: hashHex,
    activeBucketIndex: bucketIndex,
    checkedEntryIndex: null,
    matchedEntryKey: null,
    isCollisionWalk: false,
  });

  const targetBucket = buckets[bucketIndex];
  if (targetBucket.entries.length === 0) {
    steps.push({
      stepIndex: 2,
      title: `Periksa Bucket #${bucketIndex} (Kosong)`,
      explanation: `Bucket #${bucketIndex} tidak memiliki entri sama sekali. Key "${searchKey}" dipastikan tidak ada tanpa perlu memeriksa bucket lain.`,
      computedHashHex: hashHex,
      activeBucketIndex: bucketIndex,
      checkedEntryIndex: null,
      matchedEntryKey: null,
      isCollisionWalk: false,
    });
    return { steps, found: null };
  }

  for (let i = 0; i < targetBucket.entries.length; i++) {
    const entry = targetBucket.entries[i];
    const isMatch = entry.key === searchKey;
    steps.push({
      stepIndex: steps.length + 1,
      title: isMatch
        ? `Match Ditemukan di Bucket #${bucketIndex} (Slot #${i + 1})`
        : `Collision Check di Bucket #${bucketIndex} (Slot #${i + 1})`,
      explanation: isMatch
        ? `Kode hash cocok (${entry.hashHex}) dan verifikasi nilai asli mengonfirmasi key = "${entry.key}"! Mengembalikan pointer tuple ctid ${entry.ctid}.`
        : `Slot #${i + 1} berisi key "${entry.key}" (${entry.hashHex}) yang berada di bucket yang sama (Hash Collision). Melanjutkan penelusuran ke overflow chain berikutnya...`,
      computedHashHex: hashHex,
      activeBucketIndex: bucketIndex,
      checkedEntryIndex: i,
      matchedEntryKey: isMatch ? entry.key : null,
      isCollisionWalk: i > 0 || !isMatch,
    });
    if (isMatch) {
      return { steps, found: entry };
    }
  }

  steps.push({
    stepIndex: steps.length + 1,
    title: `Akhir Overflow Chain Bucket #${bucketIndex}`,
    explanation: `Seluruh entri di Bucket #${bucketIndex} telah diperiksa namun tidak ada yang cocok dengan "${searchKey}".`,
    computedHashHex: hashHex,
    activeBucketIndex: bucketIndex,
    checkedEntryIndex: null,
    matchedEntryKey: null,
    isCollisionWalk: true,
  });

  return { steps, found: null };
}

/* ============================================================================
 * 2. GIN (GENERALIZED INVERTED INDEX) ENGINE
 * ========================================================================== */

export interface GinDocument {
  docId: number;
  ctid: string;
  title: string;
  tokens: string[]; // e.g. array elements or full-text lexemes
}

export interface GinPostingEntry {
  token: string;
  docIds: number[];
  ctids: string[];
}

export interface GinTraceStep {
  stepIndex: number;
  title: string;
  explanation: string;
  activeTokens: string[];
  highlightedDocIds: number[];
  matchedDocIds: number[];
}

export const PRESET_GIN_DOCS: GinDocument[] = [
  {
    docId: 1,
    ctid: '(0,1)',
    title: 'ACADEMY DINOSAUR',
    tokens: ['trailers', 'deleted_scenes', 'dinosaur', 'drama'],
  },
  {
    docId: 2,
    ctid: '(0,2)',
    title: 'ACE GOLDFINGER',
    tokens: ['trailers', 'commentaries', 'action'],
  },
  {
    docId: 3,
    ctid: '(0,5)',
    title: 'ADAPTATION HOLES',
    tokens: ['trailers', 'behind_the_scenes', 'drama'],
  },
  {
    docId: 4,
    ctid: '(1,2)',
    title: 'AFFAIR PREJUDICE',
    tokens: ['commentaries', 'behind_the_scenes', 'dinosaur'],
  },
  {
    docId: 5,
    ctid: '(1,6)',
    title: 'AFRICAN EGG',
    tokens: ['deleted_scenes', 'behind_the_scenes', 'documentary'],
  },
];

export function buildGinInvertedIndex(docs: GinDocument[]): GinPostingEntry[] {
  const map = new Map<string, { docIds: number[]; ctids: string[] }>();
  for (const doc of docs) {
    const uniqueTokens = Array.from(new Set(doc.tokens.map((t) => t.toLowerCase().trim())));
    for (const token of uniqueTokens) {
      if (!token) continue;
      if (!map.has(token)) {
        map.set(token, { docIds: [], ctids: [] });
      }
      const item = map.get(token)!;
      item.docIds.push(doc.docId);
      item.ctids.push(doc.ctid);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([token, val]) => ({
      token,
      docIds: val.docIds,
      ctids: val.ctids,
    }));
}

export function searchGinIndex(
  docs: GinDocument[],
  invertedIndex: GinPostingEntry[],
  queryTokens: string[],
  operator: '@>' | '&&' // @> requires ALL tokens (AND intersection), && requires ANY token (OR union)
): {
  steps: GinTraceStep[];
  matchedDocs: GinDocument[];
} {
  const normalized = queryTokens
    .map((t) => t.toLowerCase().trim())
    .filter(Boolean);
  const steps: GinTraceStep[] = [];

  if (normalized.length === 0) {
    return { steps: [], matchedDocs: [] };
  }

  const tokenLists: number[][] = [];
  for (const tok of normalized) {
    const entry = invertedIndex.find((e) => e.token === tok);
    const list = entry ? entry.docIds : [];
    tokenLists.push(list);
    steps.push({
      stepIndex: steps.length + 1,
      title: `Lookup Token "${tok}" pada Entry Tree`,
      explanation: entry
        ? `Token "${tok}" ditemukan di kamus GIN! Posting List menunjuk ke dokumen ID: [${list
            .map((id) => `#${id}`)
            .join(', ')}].`
        : `Token "${tok}" tidak ditemukan di kamus GIN (Posting List kosong []).`,
      activeTokens: [tok],
      highlightedDocIds: list,
      matchedDocIds: [],
    });
  }

  let finalDocIds: number[] = [];
  if (operator === '@>') {
    // Intersection (AND)
    finalDocIds = tokenLists.reduce((acc, curr, idx) =>
      idx === 0 ? [...curr] : acc.filter((id) => curr.includes(id))
    , [] as number[]);
  } else {
    // Union (OR)
    const set = new Set<number>();
    tokenLists.forEach((l) => l.forEach((id) => set.add(id)));
    finalDocIds = Array.from(set).sort((a, b) => a - b);
  }

  steps.push({
    stepIndex: steps.length + 1,
    title:
      operator === '@>'
        ? `Bitmap Intersection (Operator @> / AND)`
        : `Bitmap Union (Operator && / OR)`,
    explanation:
      operator === '@>'
        ? `Mengambil irisan (intersection) dari seluruh Posting List agar hanya dokumen yang memuat SEMUA token [${normalized.join(
            ', '
          )}] yang terpilih: Dokumen [${finalDocIds.map((d) => `#${d}`).join(', ') || 'Tidak ada'}].`
        : `Mengambil gabungan (union) dari Posting List untuk dokumen yang memuat SALAH SATU token [${normalized.join(
            ', '
          )}]: Dokumen [${finalDocIds.map((d) => `#${d}`).join(', ') || 'Tidak ada'}].`,
    activeTokens: normalized,
    highlightedDocIds: finalDocIds,
    matchedDocIds: finalDocIds,
  });

  const matchedDocs = docs.filter((d) => finalDocIds.includes(d.docId));
  return { steps, matchedDocs };
}

/* ============================================================================
 * 3. GiST (R-TREE SPATIAL BOUNDING BOX) ENGINE
 * ========================================================================== */

export interface SpatialPoint {
  id: string;
  label: string;
  x: number; // 0..100
  y: number; // 0..100
  ctid: string;
}

export interface GistBoxNode {
  id: string;
  label: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  points: SpatialPoint[];
}

export interface GistTraceStep {
  stepIndex: number;
  title: string;
  explanation: string;
  activeBoxIds: string[];
  prunedBoxIds: string[];
  matchedPointIds: string[];
}

export const PRESET_SPATIAL_POINTS: SpatialPoint[] = [
  { id: 'P1', label: 'Store A (Jakarta Barat)', x: 18, y: 24, ctid: '(0,1)' },
  { id: 'P2', label: 'Store B (Tangerang)', x: 12, y: 36, ctid: '(0,2)' },
  { id: 'P3', label: 'Store C (Jakarta Pusat)', x: 32, y: 28, ctid: '(0,4)' },
  { id: 'P4', label: 'Store D (Bekasi)', x: 72, y: 22, ctid: '(1,1)' },
  { id: 'P5', label: 'Store E (Cikarang)', x: 84, y: 34, ctid: '(1,3)' },
  { id: 'P6', label: 'Store F (Depok)', x: 42, y: 74, ctid: '(2,1)' },
  { id: 'P7', label: 'Store G (Bogor)', x: 56, y: 86, ctid: '(2,5)' },
  { id: 'P8', label: 'Store H (Sentul)', x: 64, y: 70, ctid: '(2,8)' },
];

export function buildGistRTree(points: SpatialPoint[]): GistBoxNode[] {
  // Group points into 3 regional clusters (allowing natural MBR overlap when points are added)
  const clusters: SpatialPoint[][] = [[], [], []];
  for (const pt of points) {
    if (pt.y >= 58) {
      clusters[2].push(pt);
    } else if (pt.x < 50) {
      clusters[0].push(pt);
    } else {
      clusters[1].push(pt);
    }
  }

  const names = ['MBR Cabang Barat (R1)', 'MBR Cabang Timur (R2)', 'MBR Cabang Selatan (R3)'];
  return clusters
    .map((pts, i) => {
      if (pts.length === 0) return null;
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      return {
        id: `R${i + 1}`,
        label: names[i],
        xMin: Math.max(2, Math.min(...xs) - 6),
        yMin: Math.max(2, Math.min(...ys) - 6),
        xMax: Math.min(98, Math.max(...xs) + 6),
        yMax: Math.min(98, Math.max(...ys) + 6),
        points: pts,
      };
    })
    .filter((b): b is GistBoxNode => b !== null);
}

function boxesOverlap(
  a: { xMin: number; yMin: number; xMax: number; yMax: number },
  b: { xMin: number; yMin: number; xMax: number; yMax: number }
): boolean {
  return a.xMin <= b.xMax && a.xMax >= b.xMin && a.yMin <= b.yMax && a.yMax >= b.yMin;
}

export function searchGistBoxOverlap(
  mbrNodes: GistBoxNode[],
  queryBox: { xMin: number; yMin: number; xMax: number; yMax: number }
): {
  steps: GistTraceStep[];
  matchedPoints: SpatialPoint[];
} {
  const steps: GistTraceStep[] = [];
  const overlappingBoxes: GistBoxNode[] = [];
  const prunedIds: string[] = [];

  for (const box of mbrNodes) {
    const overlaps = boxesOverlap(box, queryBox);
    if (overlaps) {
      overlappingBoxes.push(box);
    } else {
      prunedIds.push(box.id);
    }
  }

  steps.push({
    stepIndex: 1,
    title: `Uji Interseksi Minimum Bounding Rectangle (MBR)`,
    explanation: `Memeriksa apakah kotak pencarian [(${queryBox.xMin},${queryBox.yMin})..(${queryBox.xMax},${queryBox.yMax})] berpotongan (&&) dengan MBR level atas. ${
      overlappingBoxes.length
    } MBR berpotongan (${overlappingBoxes.map((b) => b.id).join(', ') || 'tidak ada'}), sedangkan ${
      prunedIds.length
    } MBR (${prunedIds.join(', ') || 'tidak ada'}) langsung dipangkas (pruned)!`,
    activeBoxIds: overlappingBoxes.map((b) => b.id),
    prunedBoxIds: [...prunedIds],
    matchedPointIds: [],
  });

  const matchedPoints: SpatialPoint[] = [];
  for (const box of overlappingBoxes) {
    const hits = box.points.filter(
      (p) =>
        p.x >= queryBox.xMin &&
        p.x <= queryBox.xMax &&
        p.y >= queryBox.yMin &&
        p.y <= queryBox.yMax
    );
    hits.forEach((h) => matchedPoints.push(h));

    steps.push({
      stepIndex: steps.length + 1,
      title: `Periksa Titik di Dalam ${box.label}`,
      explanation: `Menelusuri titik-titik anak di dalam ${box.id}: ditemukan ${hits.length} titik yang berada tepat di dalam kotak pencarian (${
        hits.map((h) => h.id).join(', ') || 'tidak ada'
      }).`,
      activeBoxIds: [box.id],
      prunedBoxIds: [...prunedIds],
      matchedPointIds: matchedPoints.map((p) => p.id),
    });
  }

  return { steps, matchedPoints };
}

/* ============================================================================
 * 4. BRIN (BLOCK RANGE INDEX) ENGINE
 * ========================================================================== */

export interface BrinBlock {
  blockNumber: number;
  rows: Array<{ ctid: string; value: number; label: string }>;
  minVal: number;
  maxVal: number;
}

export interface BrinTraceStep {
  stepIndex: number;
  title: string;
  explanation: string;
  inspectedBlockNumber: number | null;
  eliminatedBlocks: number[];
  scannedBlocks: number[];
  matchedCtids: string[];
}

export function buildBrinBlocks(isCorrelated: boolean): BrinBlock[] {
  const rawValues = isCorrelated
    ? [
        [101, 104, 108, 112],
        [115, 119, 124, 129],
        [132, 138, 141, 147],
        [151, 156, 162, 168],
        [172, 179, 185, 190],
        [194, 201, 208, 215],
      ]
    : [
        [101, 185, 132, 208],
        [115, 201, 104, 172],
        [194, 119, 162, 108],
        [151, 129, 215, 138],
        [141, 190, 112, 168],
        [179, 124, 156, 147],
      ];

  return rawValues.map((vals, blkIdx) => ({
    blockNumber: blkIdx,
    rows: vals.map((v, rIdx) => ({
      ctid: `(${blkIdx},${rIdx + 1})`,
      value: v,
      label: `ID#${v}`,
    })),
    minVal: Math.min(...vals),
    maxVal: Math.max(...vals),
  }));
}

export function searchBrinRange(
  blocks: BrinBlock[],
  minTarget: number,
  maxTarget: number
): {
  steps: BrinTraceStep[];
  eliminatedBlocks: number[];
  scannedBlocks: number[];
  matchedCtids: string[];
} {
  const low = Math.min(minTarget, maxTarget);
  const high = Math.max(minTarget, maxTarget);
  const steps: BrinTraceStep[] = [];
  const eliminated: number[] = [];
  const scanned: number[] = [];
  const matchedCtids: string[] = [];

  for (const blk of blocks) {
    const overlaps = blk.minVal <= high && blk.maxVal >= low;
    if (!overlaps) {
      eliminated.push(blk.blockNumber);
      steps.push({
        stepIndex: steps.length + 1,
        title: `Blok Fisik #${blk.blockNumber} [Min:${blk.minVal}, Max:${blk.maxVal}] → ELIMINASI!`,
        explanation: `Rentang query [${low}..${high}] tidak berpotongan dengan ringkasan BRIN Blok #${blk.blockNumber} [${blk.minVal}..${blk.maxVal}]. Seluruh halaman disk Blok #${blk.blockNumber} dilewati tanpa I/O baca tabel!`,
        inspectedBlockNumber: blk.blockNumber,
        eliminatedBlocks: [...eliminated],
        scannedBlocks: [...scanned],
        matchedCtids: [...matchedCtids],
      });
    } else {
      scanned.push(blk.blockNumber);
      const hits = blk.rows.filter((r) => r.value >= low && r.value <= high);
      hits.forEach((h) => matchedCtids.push(h.ctid));
      steps.push({
        stepIndex: steps.length + 1,
        title: `Blok Fisik #${blk.blockNumber} [Min:${blk.minVal}, Max:${blk.maxVal}] → SCAN BLOK`,
        explanation: `Ringkasan BRIN [${blk.minVal}..${blk.maxVal}] berpotongan dengan [${low}..${high}]. Membaca 4 baris di dalam Blok #${blk.blockNumber} dan menemukan ${hits.length} baris cocok (${
          hits.map((h) => h.value).join(', ') || 'false positive blok'
        }).`,
        inspectedBlockNumber: blk.blockNumber,
        eliminatedBlocks: [...eliminated],
        scannedBlocks: [...scanned],
        matchedCtids: [...matchedCtids],
      });
    }
  }

  return {
    steps,
    eliminatedBlocks: eliminated,
    scannedBlocks: scanned,
    matchedCtids,
  };
}

/* ============================================================================
 * 5. SP-GiST (QUADTREE NON-OVERLAPPING SPACE PARTITION) ENGINE
 * ========================================================================== */

export interface QuadTreeNode {
  id: string;
  quadrantLabel: string; // 'ROOT' | 'NW' | 'NE' | 'SW' | 'SE'
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  midX: number;
  midY: number;
  isLeaf: boolean;
  points: SpatialPoint[];
  children: QuadTreeNode[]; // [NW, NE, SW, SE]
}

export function buildSpGistQuadTree(
  points: SpatialPoint[],
  capacity: number = 2
): QuadTreeNode {
  function buildNode(
    pts: SpatialPoint[],
    xMin: number,
    yMin: number,
    xMax: number,
    yMax: number,
    id: string,
    label: string,
    depth: number
  ): QuadTreeNode {
    const midX = (xMin + xMax) / 2;
    const midY = (yMin + yMax) / 2;
    if (pts.length <= capacity || depth >= 3) {
      return {
        id,
        quadrantLabel: label,
        xMin,
        yMin,
        xMax,
        yMax,
        midX,
        midY,
        isLeaf: true,
        points: pts,
        children: [],
      };
    }

    const nwPts = pts.filter((p) => p.x < midX && p.y < midY);
    const nePts = pts.filter((p) => p.x >= midX && p.y < midY);
    const swPts = pts.filter((p) => p.x < midX && p.y >= midY);
    const sePts = pts.filter((p) => p.x >= midX && p.y >= midY);

    return {
      id,
      quadrantLabel: label,
      xMin,
      yMin,
      xMax,
      yMax,
      midX,
      midY,
      isLeaf: false,
      points: [],
      children: [
        buildNode(nwPts, xMin, yMin, midX, midY, `${id}-NW`, 'NW', depth + 1),
        buildNode(nePts, midX, yMin, xMax, midY, `${id}-NE`, 'NE', depth + 1),
        buildNode(swPts, xMin, midY, midX, yMax, `${id}-SW`, 'SW', depth + 1),
        buildNode(sePts, midX, midY, xMax, yMax, `${id}-SE`, 'SE', depth + 1),
      ],
    };
  }

  return buildNode(points, 0, 0, 100, 100, 'QT', 'ROOT', 0);
}

export interface SpGistTraceStep {
  stepIndex: number;
  title: string;
  explanation: string;
  activeQuadrantId: string;
  visitedQuadrantIds: string[];
  matchedPointIds: string[];
}

export function searchSpGistQuadTree(
  root: QuadTreeNode,
  queryBox: { xMin: number; yMin: number; xMax: number; yMax: number }
): {
  steps: SpGistTraceStep[];
  matchedPoints: SpatialPoint[];
} {
  const steps: SpGistTraceStep[] = [];
  const visited: string[] = [];
  const matched: SpatialPoint[] = [];

  function traverse(node: QuadTreeNode) {
    if (!boxesOverlap(node, queryBox)) {
      return;
    }
    visited.push(node.id);
    if (node.isLeaf) {
      const hits = node.points.filter(
        (p) =>
          p.x >= queryBox.xMin &&
          p.x <= queryBox.xMax &&
          p.y >= queryBox.yMin &&
          p.y <= queryBox.yMax
      );
      hits.forEach((h) => matched.push(h));
      steps.push({
        stepIndex: steps.length + 1,
        title: `Periksa Leaf Partisi ${node.id}`,
        explanation: `Kuadran non-overlapping ${node.id} [(${node.xMin},${node.yMin})..(${node.xMax},${node.yMax})] berpotongan dengan area cari. Ditemukan ${hits.length} titik cocok.`,
        activeQuadrantId: node.id,
        visitedQuadrantIds: [...visited],
        matchedPointIds: matched.map((m) => m.id),
      });
    } else {
      steps.push({
        stepIndex: steps.length + 1,
        title: `Partisi Ruang ${node.id} (Split di X=${node.midX}, Y=${node.midY})`,
        explanation: `Memilih sub-kuadran (NW, NE, SW, SE) yang berpotongan dengan area pencarian. Karena partisi SP-GiST saling lepas (disjoint), kuadran di luar area langsung dilewati.`,
        activeQuadrantId: node.id,
        visitedQuadrantIds: [...visited],
        matchedPointIds: matched.map((m) => m.id),
      });
      node.children.forEach(traverse);
    }
  }

  traverse(root);
  return { steps, matchedPoints: matched };
}

/* ============================================================================
 * 6. BLOOM FILTER MULTI-COLUMN INDEX ENGINE
 * ========================================================================== */

export interface BloomRowTuple {
  rowId: number;
  ctid: string;
  customerId: number;
  staffId: number;
  rating: string;
  signatureBits: number[]; // length 16 (0 or 1)
  colBitPositions: {
    customerId: [number, number];
    staffId: [number, number];
    rating: [number, number];
  };
}

export function computeColumnBloomBits(
  colIndex: number,
  val: string | number,
  bitLength: number = 16
): [number, number] {
  const str = `${colIndex}:${val}`;
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ c;
    h2 = Math.imul(h2, 31) + c;
  }
  const b1 = (h1 >>> 0) % bitLength;
  let b2 = (h2 >>> 0) % bitLength;
  if (b2 === b1) {
    b2 = (b1 + 5) % bitLength;
  }
  return [b1, b2];
}

export function createBloomRowTuple(
  rowId: number,
  ctid: string,
  customerId: number,
  staffId: number,
  rating: string,
  bitLength: number = 16
): BloomRowTuple {
  const sig = Array(bitLength).fill(0);
  const cBits = computeColumnBloomBits(1, customerId, bitLength);
  const sBits = computeColumnBloomBits(2, staffId, bitLength);
  const rBits = computeColumnBloomBits(3, rating, bitLength);

  [...cBits, ...sBits, ...rBits].forEach((pos) => {
    sig[pos] = 1;
  });

  return {
    rowId,
    ctid,
    customerId,
    staffId,
    rating,
    signatureBits: sig,
    colBitPositions: {
      customerId: cBits,
      staffId: sBits,
      rating: rBits,
    },
  };
}

export const PRESET_BLOOM_ROWS: BloomRowTuple[] = [
  createBloomRowTuple(1, '(0,1)', 12, 1, 'PG'),
  createBloomRowTuple(2, '(0,3)', 25, 2, 'R'),
  createBloomRowTuple(3, '(0,6)', 12, 2, 'NC-17'),
  createBloomRowTuple(4, '(1,2)', 40, 1, 'G'),
  createBloomRowTuple(5, '(1,5)', 31, 2, 'PG-13'),
  createBloomRowTuple(6, '(2,1)', 18, 1, 'R'),
];

export interface BloomSearchEvaluation {
  targetMask: number[];
  activeBitIndices: number[];
  rowResults: Array<{
    row: BloomRowTuple;
    signaturePassed: boolean;
    exactMatch: boolean;
    status: 'DEFINITE_NO' | 'TRUE_POSITIVE' | 'FALSE_POSITIVE';
    missingBits: number[];
  }>;
}

export function evaluateBloomQuery(
  rows: BloomRowTuple[],
  filter: {
    customerId?: number | null;
    staffId?: number | null;
    rating?: string | null;
  },
  bitLength: number = 16
): BloomSearchEvaluation {
  const targetMask = Array(bitLength).fill(0);
  const activeSet = new Set<number>();

  if (filter.customerId !== undefined && filter.customerId !== null) {
    computeColumnBloomBits(1, filter.customerId, bitLength).forEach((b) => {
      targetMask[b] = 1;
      activeSet.add(b);
    });
  }
  if (filter.staffId !== undefined && filter.staffId !== null) {
    computeColumnBloomBits(2, filter.staffId, bitLength).forEach((b) => {
      targetMask[b] = 1;
      activeSet.add(b);
    });
  }
  if (filter.rating !== undefined && filter.rating !== null && filter.rating !== '') {
    computeColumnBloomBits(3, filter.rating, bitLength).forEach((b) => {
      targetMask[b] = 1;
      activeSet.add(b);
    });
  }

  const activeBitIndices = Array.from(activeSet).sort((a, b) => a - b);

  const rowResults = rows.map((row) => {
    const missingBits = activeBitIndices.filter((bitIdx) => row.signatureBits[bitIdx] === 0);
    const signaturePassed = missingBits.length === 0;

    const exactMatch =
      (filter.customerId == null || row.customerId === filter.customerId) &&
      (filter.staffId == null || row.staffId === filter.staffId) &&
      (!filter.rating || row.rating === filter.rating);

    let status: 'DEFINITE_NO' | 'TRUE_POSITIVE' | 'FALSE_POSITIVE' = 'DEFINITE_NO';
    if (signaturePassed) {
      status = exactMatch ? 'TRUE_POSITIVE' : 'FALSE_POSITIVE';
    }

    return {
      row,
      signaturePassed,
      exactMatch,
      status,
      missingBits,
    };
  });

  return {
    targetMask,
    activeBitIndices,
    rowResults,
  };
}

/* ============================================================================
 * 7. QUERY PERFORMANCE LAB SIMULATOR ENGINE
 * ========================================================================== */

export function simulateQueryPerformance(
  scenario: PerfScenario,
  totalRows: number,
  indexChoice: IndexTypeId | 'none'
): SimulatedPlanResult {
  const rowsPerBlock = 40;
  const totalBlocks = Math.ceil(totalRows / rowsPerBlock);
  const matchingRows = Math.max(1, Math.round(totalRows * scenario.selectivityRatio));

  // Sequential Scan baseline
  if (indexChoice === 'none') {
    const seqTime = Number((totalRows * 0.00042 + 0.35).toFixed(2));
    return {
      modeLabel: 'Tanpa Index (Sequential Scan)',
      indexType: 'none',
      scanType: 'Seq Scan',
      isSupported: true,
      rowsScanned: totalRows,
      rowsReturned: matchingRows,
      blocksRead: totalBlocks,
      totalBlocks,
      simulatedTimeMs: seqTime,
      indexSizeKb: 0,
      explainAnalyzeText: [
        `Seq Scan on ${scenario.table}  (cost=0.00..${(totalBlocks * 1.45).toFixed(2)} rows=${matchingRows} width=64) (actual time=0.04..${seqTime} ms rows=${matchingRows} loops=1)`,
        `  Filter: (${scenario.whereClauseDescription})`,
        `  Rows Removed by Filter: ${totalRows - matchingRows}`,
        `Planning Time: 0.08 ms`,
        `Execution Time: ${seqTime} ms (Simulated Educational Metric)`,
      ],
      notes: 'Membaca setiap blok fisik tabel dari awal sampai akhir (100% baris diperiksa).',
    };
  }

  // Check if index supports the scenario's query pattern
  const isRangeScenario = scenario.id === 'scen-range-rental-date';
  const isArrayScenario = scenario.id === 'scen-array-containment';
  const isSpatialScenario = scenario.id === 'scen-spatial-box';
  const isNonLeadingMulti = scenario.id === 'scen-multicolumn-nonleading';

  let supported = true;
  if (isRangeScenario && (indexChoice === 'hash' || indexChoice === 'bloom')) {
    supported = false;
  }
  if (isArrayScenario && (indexChoice === 'btree' || indexChoice === 'hash')) {
    supported = false;
  }
  if (isSpatialScenario && (indexChoice === 'btree' || indexChoice === 'hash')) {
    supported = false;
  }

  if (!supported) {
    const seqTime = Number((totalRows * 0.00042 + 0.35).toFixed(2));
    return {
      modeLabel: `Index: ${indexChoice.toUpperCase()} (Operator Tidak Didukung)`,
      indexType: indexChoice,
      scanType: 'Seq Scan (Fallback - Operator Unsupported)',
      isSupported: false,
      rowsScanned: totalRows,
      rowsReturned: matchingRows,
      blocksRead: totalBlocks,
      totalBlocks,
      simulatedTimeMs: seqTime,
      indexSizeKb: Math.round((totalRows * 24) / 1024),
      explainAnalyzeText: [
        `-- PERINGATAN: Index ${indexChoice.toUpperCase()} tidak mendukung operator pada query ini!`,
        `-- PostgreSQL Planner otomatis jatuh kembali (fallback) ke Sequential Scan:`,
        `Seq Scan on ${scenario.table}  (cost=0.00..${(totalBlocks * 1.45).toFixed(2)} rows=${matchingRows} width=64) (actual time=0.05..${seqTime} ms rows=${matchingRows} loops=1)`,
        `  Filter: (${scenario.whereClauseDescription})`,
        `  Rows Removed by Filter: ${totalRows - matchingRows}`,
        `Execution Time: ${seqTime} ms (Simulated Educational Metric)`,
      ],
      notes: `Index ${indexChoice.toUpperCase()} tidak mendukung operator klausa WHERE ini sehingga diabaikan oleh Query Planner.`,
    };
  }

  // Specific behavior per index type
  if (indexChoice === 'brin') {
    const blocksScanned = Math.max(2, Math.ceil(totalBlocks * (scenario.selectivityRatio * 2.2)));
    const rowsScanned = Math.min(totalRows, blocksScanned * rowsPerBlock);
    const brinTime = Number((rowsScanned * 0.00048 + 0.18).toFixed(2));
    const brinSizeKb = Math.max(8, Math.round(totalBlocks * 0.08));
    return {
      modeLabel: 'BRIN (Block Range Index)',
      indexType: 'brin',
      scanType: 'Bitmap Heap Scan + Bitmap Index Scan',
      isSupported: true,
      rowsScanned,
      rowsReturned: matchingRows,
      blocksRead: blocksScanned,
      totalBlocks,
      simulatedTimeMs: brinTime,
      indexSizeKb: brinSizeKb,
      falsePositiveRowsRechecked: rowsScanned - matchingRows,
      explainAnalyzeText: [
        `Bitmap Heap Scan on ${scenario.table}  (cost=12.40..${(blocksScanned * 2.1).toFixed(2)} rows=${matchingRows} width=64) (actual time=0.09..${brinTime} ms rows=${matchingRows} loops=1)`,
        `  Recheck Cond: (${scenario.whereClauseDescription})`,
        `  Rows Removed by Index Recheck: ${rowsScanned - matchingRows}`,
        `  Heap Blocks: lossy=${blocksScanned} (eliminated ${totalBlocks - blocksScanned} of ${totalBlocks} blocks)`,
        `  -> Bitmap Index Scan on idx_${scenario.table}_brin  (actual time=0.04..0.04 ms)`,
        `Execution Time: ${brinTime} ms (Simulated Educational Metric)`,
      ],
      notes: `BRIN sangat hemat ruang (${brinSizeKb} KB) dan mengeliminasi ${
        totalBlocks - blocksScanned
      } blok fisik, namun tetap harus memeriksa seluruh baris di dalam ${blocksScanned} blok yang lolos.`,
    };
  }

  if (indexChoice === 'bloom') {
    const falsePositives = Math.round(totalRows * 0.018);
    const rowsScanned = matchingRows + falsePositives;
    const blocksRead = Math.min(totalBlocks, Math.ceil(rowsScanned / 4));
    const bloomTime = Number((totalRows * 0.00009 + rowsScanned * 0.0005 + 0.22).toFixed(2));
    const bloomSizeKb = Math.max(16, Math.round((totalRows * 12) / 1024));
    return {
      modeLabel: 'Bloom Filter Index',
      indexType: 'bloom',
      scanType: 'Bitmap Heap Scan + Bitmap Index Scan',
      isSupported: true,
      rowsScanned,
      rowsReturned: matchingRows,
      blocksRead,
      totalBlocks,
      simulatedTimeMs: bloomTime,
      indexSizeKb: bloomSizeKb,
      falsePositiveRowsRechecked: falsePositives,
      explainAnalyzeText: [
        `Bitmap Heap Scan on ${scenario.table}  (cost=18.50..${(blocksRead * 1.9).toFixed(2)} rows=${matchingRows} width=64) (actual time=0.14..${bloomTime} ms rows=${matchingRows} loops=1)`,
        `  Recheck Cond: (${scenario.whereClauseDescription})`,
        `  Rows Removed by Index Recheck: ${falsePositives} (Bloom False Positives)`,
        `  -> Bitmap Index Scan on idx_${scenario.table}_bloom  (rows=${rowsScanned})`,
        `Execution Time: ${bloomTime} ms (Simulated Educational Metric)`,
      ],
      notes: `Bloom menyaring sebagian besar baris lewat signature bit tanpa peduli urutan kolom, lalu membuang ${falsePositives} baris False Positive saat Heap Recheck.`,
    };
  }

  if (isNonLeadingMulti && indexChoice === 'btree_multicolumn') {
    // Non-leading column on Multicolumn B-tree scans all index leaves
    const rowsScanned = Math.round(totalRows * 0.65);
    const blocksRead = Math.ceil(totalBlocks * 0.55);
    const slowIndexTime = Number((totalRows * 0.00031 + 0.28).toFixed(2));
    const sizeKb = Math.round((totalRows * 34) / 1024);
    return {
      modeLabel: 'Multicolumn B-Tree (Tanpa Leading Column)',
      indexType: 'btree_multicolumn',
      scanType: 'Index Scan',
      isSupported: true,
      rowsScanned,
      rowsReturned: matchingRows,
      blocksRead,
      totalBlocks,
      simulatedTimeMs: slowIndexTime,
      indexSizeKb: sizeKb,
      explainAnalyzeText: [
        `Index Scan using idx_${scenario.table}_multicolumn on ${scenario.table}  (actual time=0.15..${slowIndexTime} ms rows=${matchingRows} loops=1)`,
        `  Index Cond: (staff_id = 2 AND inventory_id = 1045) -- Leading column customer_id OMITTED!`,
        `  Note: Harus memindai sebagian besar leaf node karena leading column tidak disertakan.`,
        `Execution Time: ${slowIndexTime} ms (Simulated Educational Metric)`,
      ],
      notes:
        'Karena kolom pertama (customer_id) tidak ada di WHERE, Multicolumn B-Tree tidak bisa langsung melompat ke satu sub-cabang.',
    };
  }

  // Standard high-efficiency index scan (B-Tree, Hash, GIN, GiST, SP-GiST)
  const treeDepth = Math.max(2, Math.ceil(Math.log(totalRows) / Math.log(120)));
  const rowsScanned = matchingRows;
  const blocksRead = Math.min(totalBlocks, treeDepth + Math.ceil(matchingRows / 6));
  const fastTime = Number((treeDepth * 0.04 + matchingRows * 0.00045 + 0.08).toFixed(2));
  const sizeMultiplier =
    indexChoice === 'gin'
      ? 42
      : indexChoice === 'gist'
      ? 36
      : indexChoice === 'hash'
      ? 20
      : 28;
  const indexSizeKb = Math.max(16, Math.round((totalRows * sizeMultiplier) / 1024));

  return {
    modeLabel: `Index: ${indexChoice.toUpperCase()}`,
    indexType: indexChoice,
    scanType:
      indexChoice === 'gin' ? 'Bitmap Heap Scan + Bitmap Index Scan' : 'Index Scan',
    isSupported: true,
    rowsScanned,
    rowsReturned: matchingRows,
    blocksRead,
    totalBlocks,
    simulatedTimeMs: fastTime,
    indexSizeKb,
    explainAnalyzeText: [
      `${
        indexChoice === 'gin' ? 'Bitmap Heap Scan' : 'Index Scan'
      } using idx_${scenario.table}_${indexChoice} on ${scenario.table}  (cost=0.29..${(
        blocksRead * 1.15
      ).toFixed(2)} rows=${matchingRows} width=64) (actual time=0.03..${fastTime} ms rows=${matchingRows} loops=1)`,
      `  Index Cond: (${scenario.whereClauseDescription})`,
      `  Buffers: shared hit=${blocksRead}`,
      `Planning Time: 0.09 ms`,
      `Execution Time: ${fastTime} ms (Simulated Educational Metric)`,
    ],
    notes: `Menemukan ${matchingRows} baris secara langsung dengan hanya membaca ${blocksRead} dari ${totalBlocks} blok.`,
  };
}

