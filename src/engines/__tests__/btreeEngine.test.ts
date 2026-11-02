import { describe, expect, it } from 'vitest';
import {
  buildPresetBTree,
  deleteBTreeKey,
  insertBTree,
  PRESET_MULTICOLUMN_BTREE_ENTRIES,
  PRESET_SINGLE_BTREE_ENTRIES,
  searchBTreeEquality,
  searchBTreeRange,
  searchMulticolumnNonLeading,
  traverseBTreeOrder,
} from '../btreeEngine';

describe('B-Tree Engine (Single & Multicolumn)', () => {
  it('builds a multi-level B+Tree and splits nodes while keeping leaf entries sorted', () => {
    const root = buildPresetBTree(PRESET_SINGLE_BTREE_ENTRIES, 3);
    expect(root.isLeaf).toBe(false);

    // Traverse order ASC should return all 9 entries in strictly ascending order
    const orderRes = traverseBTreeOrder(root, 'ASC');
    expect(orderRes.foundEntries.map((e) => e.key)).toEqual([
      10, 20, 30, 40, 45, 50, 60, 70, 80,
    ]);
  });

  it('finds existing key via equality search and records descent steps', () => {
    const root = buildPresetBTree(PRESET_SINGLE_BTREE_ENTRIES, 3);
    const res = searchBTreeEquality(root, 45);
    expect(res.foundEntries).toHaveLength(1);
    expect(res.foundEntries[0].ctid).toBe('(1,3)');
    expect(res.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('performs range scan across linked leaves for BETWEEN queries', () => {
    const root = buildPresetBTree(PRESET_SINGLE_BTREE_ENTRIES, 3);
    const res = searchBTreeRange(root, 25, 65);
    expect(res.foundEntries.map((e) => e.key)).toEqual([30, 40, 45, 50, 60]);
    expect(
      res.steps.some((s) => s.horizontalLinkFromId !== null && s.horizontalLinkFromId !== undefined)
    ).toBe(true);
  });

  it('deletes a key and maintains valid B+Tree structure', () => {
    const root = buildPresetBTree(PRESET_SINGLE_BTREE_ENTRIES, 3);
    const afterDel = deleteBTreeKey(root, 45, undefined, 3);
    const check = searchBTreeEquality(afterDel.root, 45);
    expect(check.foundEntries).toHaveLength(0);
  });

  it('supports multicolumn composite search and contrasts leading vs non-leading column filter', () => {
    const root = buildPresetBTree(PRESET_MULTICOLUMN_BTREE_ENTRIES, 3);
    const leadingSearch = searchBTreeEquality(root, 12, 2);
    expect(leadingSearch.foundEntries).toHaveLength(1);
    expect(leadingSearch.foundEntries[0].label).toBe('(12, 2)');

    const nonLeadingSearch = searchMulticolumnNonLeading(root, 2);
    expect(nonLeadingSearch.foundEntries).toHaveLength(4);
    // Non-leading must scan all leaves
    expect(
      nonLeadingSearch.steps[nonLeadingSearch.steps.length - 1].metrics.nodesVisited
    ).toBeGreaterThan(leadingSearch.steps[leadingSearch.steps.length - 1].metrics.nodesVisited);
  });
});

