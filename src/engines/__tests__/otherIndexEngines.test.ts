import { describe, expect, it } from 'vitest';
import { PERF_LAB_SCENARIOS } from '../../data/indexCatalog';
import {
  buildBrinBlocks,
  buildGinInvertedIndex,
  buildGistRTree,
  buildHashBuckets,
  buildSpGistQuadTree,
  evaluateBloomQuery,
  PRESET_BLOOM_ROWS,
  PRESET_GIN_DOCS,
  PRESET_HASH_ITEMS,
  PRESET_SPATIAL_POINTS,
  searchBrinRange,
  searchGinIndex,
  searchGistBoxOverlap,
  searchHashIndex,
  searchSpGistQuadTree,
  simulateQueryPerformance,
} from '../otherIndexEngines';

describe('Other 6 PostgreSQL Index Engines (Hash, GIN, GiST, BRIN, SP-GiST, Bloom)', () => {
  it('Hash engine hashes keys into buckets and finds equality matches', () => {
    const buckets = buildHashBuckets(PRESET_HASH_ITEMS, 8);
    const res = searchHashIndex(buckets, 'NC-17');
    expect(res.found).not.toBeNull();
    expect(res.found?.ctid).toBe('(1,5)');
    expect(res.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('GIN engine builds inverted posting lists and supports @> (AND) and && (OR)', () => {
    const inv = buildGinInvertedIndex(PRESET_GIN_DOCS);
    const andRes = searchGinIndex(PRESET_GIN_DOCS, inv, ['trailers', 'drama'], '@>');
    expect(andRes.matchedDocs.map((d) => d.docId)).toEqual([1, 3]);

    const orRes = searchGinIndex(PRESET_GIN_DOCS, inv, ['dinosaur', 'documentary'], '&&');
    expect(orRes.matchedDocs.map((d) => d.docId)).toEqual([1, 4, 5]);
  });

  it('GiST engine builds 2D bounding boxes and prunes non-overlapping MBRs', () => {
    const mbrs = buildGistRTree(PRESET_SPATIAL_POINTS);
    const res = searchGistBoxOverlap(mbrs, { xMin: 10, yMin: 15, xMax: 40, yMax: 40 });
    expect(res.matchedPoints.map((p) => p.id)).toEqual(['P1', 'P2', 'P3']);
    expect(res.steps[0].prunedBoxIds.length).toBeGreaterThanOrEqual(1);
  });

  it('BRIN engine eliminates blocks effectively when data is physically correlated', () => {
    const correlated = buildBrinBlocks(true);
    const uncorrelated = buildBrinBlocks(false);

    const corrRes = searchBrinRange(correlated, 130, 148);
    const uncorrRes = searchBrinRange(uncorrelated, 130, 148);

    expect(corrRes.eliminatedBlocks.length).toBeGreaterThan(uncorrRes.eliminatedBlocks.length);
  });

  it('SP-GiST engine recursively partitions 2D space into disjoint quadrants', () => {
    const qt = buildSpGistQuadTree(PRESET_SPATIAL_POINTS, 2);
    expect(qt.isLeaf).toBe(false);
    expect(qt.children).toHaveLength(4);

    const res = searchSpGistQuadTree(qt, { xMin: 10, yMin: 15, xMax: 40, yMax: 40 });
    expect(res.matchedPoints.map((p) => p.id).sort()).toEqual(['P1', 'P2', 'P3']);
  });

  it('Bloom engine filters multi-column queries without requiring leading column', () => {
    const evalRes = evaluateBloomQuery(PRESET_BLOOM_ROWS, { staffId: 2, rating: 'NC-17' });
    const trueMatches = evalRes.rowResults.filter((r) => r.status === 'TRUE_POSITIVE');
    expect(trueMatches).toHaveLength(1);
    expect(trueMatches[0].row.rowId).toBe(3);
  });

  it('Query Performance Lab engine simulates Seq Scan vs Index Scan accurately', () => {
    const scen = PERF_LAB_SCENARIOS[0];
    const seq = simulateQueryPerformance(scen, 50000, 'none');
    const btree = simulateQueryPerformance(scen, 50000, 'btree');
    const hashUnsupported = simulateQueryPerformance(scen, 50000, 'hash');

    expect(btree.rowsScanned).toBeLessThan(seq.rowsScanned);
    expect(hashUnsupported.isSupported).toBe(false);
  });
});

