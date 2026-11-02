export interface BTreeEntry {
  key: number;
  secondaryKey?: number; // used in Multicolumn mode (col1 = key, col2 = secondaryKey)
  label: string;         // display label e.g. "25" or "(12, 2)"
  ctid: string;          // simulated PostgreSQL tuple pointer e.g. "(0,4)"
  rowSummary: string;    // e.g. "film_id=25 · ACADEMY DINOSAUR · $2.99"
}

export interface BTreeNode {
  id: string;
  isLeaf: boolean;
  keys: number[];
  secondaryKeys?: number[];
  entries: BTreeEntry[]; // populated for leaf nodes
  children: BTreeNode[]; // populated for internal nodes
  nextLeafId?: string | null;
}

export interface BTreeTraceStep {
  stepIndex: number;
  title: string;
  explanation: string;
  activeNodeId: string | null;
  visitedNodeIds: string[];
  matchedNodeIds: string[];
  matchedEntryKeys: string[]; // entry.label
  splitNodeId?: string | null;
  eliminatedNodeIds?: string[];
  horizontalLinkFromId?: string | null;
  horizontalLinkToId?: string | null;
  treeSnapshot: BTreeNode;
  metrics: {
    nodesVisited: number;
    keyComparisons: number;
    tuplesMatched: number;
    scanStrategy: string;
  };
}

export interface BTreeSimulationResult {
  root: BTreeNode;
  steps: BTreeTraceStep[];
  foundEntries: BTreeEntry[];
}

function cloneTree(node: BTreeNode): BTreeNode {
  return {
    id: node.id,
    isLeaf: node.isLeaf,
    keys: [...node.keys],
    secondaryKeys: node.secondaryKeys ? [...node.secondaryKeys] : undefined,
    entries: node.entries.map((e) => ({ ...e })),
    children: node.children.map(cloneTree),
    nextLeafId: node.nextLeafId ?? null,
  };
}

export function compareComposite(
  aKey: number,
  aSec: number | undefined,
  bKey: number,
  bSec: number | undefined
): number {
  if (aKey !== bKey) return aKey - bKey;
  return (aSec ?? 0) - (bSec ?? 0);
}

export function formatEntryLabel(key: number, secondaryKey?: number): string {
  return secondaryKey !== undefined ? `(${key}, ${secondaryKey})` : `${key}`;
}

/**
 * Rebuild leaf horizontal sibling links (nextLeafId) in left-to-right order
 * and assign deterministic level-based IDs so SVG layout stays stable.
 */
function relinkLeaves(root: BTreeNode): void {
  const leaves: BTreeNode[] = [];
  let counter = 1;

  function dfs(n: BTreeNode, depth: number) {
    if (!n.id) {
      n.id = `node-${depth}-${counter++}`;
    }
    if (n.isLeaf) {
      leaves.push(n);
    } else {
      n.children.forEach((child) => dfs(child, depth + 1));
    }
  }
  dfs(root, 0);

  for (let i = 0; i < leaves.length; i++) {
    leaves[i].nextLeafId = i < leaves.length - 1 ? leaves[i + 1].id : null;
  }
}

export function createEmptyBTree(): BTreeNode {
  return {
    id: 'root-leaf-1',
    isLeaf: true,
    keys: [],
    entries: [],
    children: [],
    nextLeafId: null,
  };
}

let uniqueNodeSeq = 100;
function nextNodeId(prefix: string): string {
  uniqueNodeSeq += 1;
  return `${prefix}-${uniqueNodeSeq}`;
}

/**
 * Insert an entry into a PostgreSQL-style B+Tree of capacity `maxKeys` per node (default 3).
 * Returns the updated root and step-by-step trace frames including Node Split events.
 */
export function insertBTree(
  currentRoot: BTreeNode,
  entry: BTreeEntry,
  maxKeys: number = 3
): BTreeSimulationResult {
  const root = cloneTree(currentRoot);
  const steps: BTreeTraceStep[] = [];
  const visited: string[] = [];
  let comparisons = 0;

  // Trace descent path
  let cursor = root;
  while (!cursor.isLeaf) {
    visited.push(cursor.id);
    let childIdx = cursor.keys.length;
    for (let i = 0; i < cursor.keys.length; i++) {
      comparisons++;
      const cmp = compareComposite(
        entry.key,
        entry.secondaryKey,
        cursor.keys[i],
        cursor.secondaryKeys?.[i]
      );
      if (cmp < 0) {
        childIdx = i;
        break;
      }
    }
    const chosenKeyNote =
      childIdx === 0
        ? `< ${formatEntryLabel(cursor.keys[0], cursor.secondaryKeys?.[0])}`
        : childIdx === cursor.keys.length
        ? `>= ${formatEntryLabel(
            cursor.keys[cursor.keys.length - 1],
            cursor.secondaryKeys?.[cursor.keys.length - 1]
          )}`
        : `di antara key cabang #${childIdx} dan #${childIdx + 1}`;

    steps.push({
      stepIndex: steps.length + 1,
      title: `Traversal Internal Node (${cursor.id})`,
      explanation: `Mencari posisi insert untuk key ${entry.label}. Nilai ${entry.label} berada ${chosenKeyNote}, sehingga turun ke cabang anak ke-${childIdx + 1}.`,
      activeNodeId: cursor.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [],
      matchedEntryKeys: [],
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: comparisons,
        tuplesMatched: 0,
        scanStrategy: 'B-Tree Tree Descent',
      },
    });

    cursor = cursor.children[childIdx];
  }

  visited.push(cursor.id);

  // Recursive insert helper that handles splits bottom-up
  let splitOccurred = false;
  let splitLeafLabel = '';

  function insertRecursive(node: BTreeNode): {
    promotedKey?: number;
    promotedSec?: number;
    rightNode?: BTreeNode;
  } {
    if (node.isLeaf) {
      // Check duplicate exact label
      const existingIdx = node.entries.findIndex(
        (e) =>
          compareComposite(
            e.key,
            e.secondaryKey,
            entry.key,
            entry.secondaryKey
          ) === 0
      );
      if (existingIdx !== -1) {
        node.entries[existingIdx] = { ...entry };
      } else {
        node.entries.push({ ...entry });
        node.entries.sort((a, b) =>
          compareComposite(a.key, a.secondaryKey, b.key, b.secondaryKey)
        );
      }
      node.keys = node.entries.map((e) => e.key);
      if (entry.secondaryKey !== undefined) {
        node.secondaryKeys = node.entries.map((e) => e.secondaryKey ?? 0);
      }

      if (node.entries.length <= maxKeys) {
        return {};
      }

      // Split leaf node
      splitOccurred = true;
      const mid = Math.ceil(node.entries.length / 2);
      const rightEntries = node.entries.splice(mid);
      node.keys = node.entries.map((e) => e.key);
      if (entry.secondaryKey !== undefined) {
        node.secondaryKeys = node.entries.map((e) => e.secondaryKey ?? 0);
      }

      const rightLeaf: BTreeNode = {
        id: nextNodeId('leaf'),
        isLeaf: true,
        keys: rightEntries.map((e) => e.key),
        secondaryKeys:
          entry.secondaryKey !== undefined
            ? rightEntries.map((e) => e.secondaryKey ?? 0)
            : undefined,
        entries: rightEntries,
        children: [],
        nextLeafId: node.nextLeafId ?? null,
      };
      node.nextLeafId = rightLeaf.id;
      splitLeafLabel = rightEntries[0].label;

      return {
        promotedKey: rightEntries[0].key,
        promotedSec: rightEntries[0].secondaryKey,
        rightNode: rightLeaf,
      };
    }

    // Internal node
    let idx = node.keys.length;
    for (let i = 0; i < node.keys.length; i++) {
      if (
        compareComposite(
          entry.key,
          entry.secondaryKey,
          node.keys[i],
          node.secondaryKeys?.[i]
        ) < 0
      ) {
        idx = i;
        break;
      }
    }

    const res = insertRecursive(node.children[idx]);
    if (!res.rightNode || res.promotedKey === undefined) {
      return {};
    }

    // Insert promoted key into internal node
    node.keys.splice(idx, 0, res.promotedKey);
    if (res.promotedSec !== undefined) {
      if (!node.secondaryKeys) node.secondaryKeys = [];
      node.secondaryKeys.splice(idx, 0, res.promotedSec);
    }
    node.children.splice(idx + 1, 0, res.rightNode);

    if (node.keys.length <= maxKeys) {
      return {};
    }

    // Split internal node
    splitOccurred = true;
    const mid = Math.floor(node.keys.length / 2);
    const upKey = node.keys[mid];
    const upSec = node.secondaryKeys ? node.secondaryKeys[mid] : undefined;

    const rightKeys = node.keys.splice(mid + 1);
    node.keys.splice(mid, 1); // remove promoted separator from left internal node

    let rightSecKeys: number[] | undefined;
    if (node.secondaryKeys) {
      rightSecKeys = node.secondaryKeys.splice(mid + 1);
      node.secondaryKeys.splice(mid, 1);
    }

    const rightChildren = node.children.splice(mid + 1);
    const rightInternal: BTreeNode = {
      id: nextNodeId('internal'),
      isLeaf: false,
      keys: rightKeys,
      secondaryKeys: rightSecKeys,
      entries: [],
      children: rightChildren,
      nextLeafId: null,
    };

    return {
      promotedKey: upKey,
      promotedSec: upSec,
      rightNode: rightInternal,
    };
  }

  const rootRes = insertRecursive(root);
  let finalRoot = root;
  if (rootRes.rightNode && rootRes.promotedKey !== undefined) {
    finalRoot = {
      id: nextNodeId('root'),
      isLeaf: false,
      keys: [rootRes.promotedKey],
      secondaryKeys:
        rootRes.promotedSec !== undefined ? [rootRes.promotedSec] : undefined,
      entries: [],
      children: [root, rootRes.rightNode],
      nextLeafId: null,
    };
  }

  relinkLeaves(finalRoot);

  steps.push({
    stepIndex: steps.length + 1,
    title: splitOccurred
      ? `Insert ${entry.label} & Node Split!`
      : `Insert ${entry.label} ke Leaf Node`,
    explanation: splitOccurred
      ? `Leaf node melebihi kapasitas maksimum (${maxKeys} key), sehingga terjadi Node Split! Separator key (${splitLeafLabel}) dipromosikan ke Parent Node dan pointer horizontal antar leaf diperbarui.`
      : `Key ${entry.label} (ctid ${entry.ctid}) disisipkan secara terurut ke dalam Leaf Node (${cursor.id}) tanpa perlu memecah node.`,
    activeNodeId: cursor.id,
    visitedNodeIds: [...visited],
    matchedNodeIds: [cursor.id],
    matchedEntryKeys: [entry.label],
    splitNodeId: splitOccurred ? finalRoot.id : null,
    treeSnapshot: cloneTree(finalRoot),
    metrics: {
      nodesVisited: visited.length,
      keyComparisons: comparisons + 1,
      tuplesMatched: 1,
      scanStrategy: splitOccurred ? 'B-Tree Insert + Page Split' : 'B-Tree Leaf Insert',
    },
  });

  return {
    root: finalRoot,
    steps,
    foundEntries: [entry],
  };
}

/**
 * Equality Search (WHERE key = target)
 */
export function searchBTreeEquality(
  root: BTreeNode,
  targetKey: number,
  targetSecondaryKey?: number
): BTreeSimulationResult {
  const steps: BTreeTraceStep[] = [];
  const visited: string[] = [];
  let comparisons = 0;
  let cursor = root;
  const targetLabel = formatEntryLabel(targetKey, targetSecondaryKey);

  while (!cursor.isLeaf) {
    visited.push(cursor.id);
    let childIdx = cursor.keys.length;
    for (let i = 0; i < cursor.keys.length; i++) {
      comparisons++;
      const cmp =
        targetSecondaryKey !== undefined
          ? compareComposite(
              targetKey,
              targetSecondaryKey,
              cursor.keys[i],
              cursor.secondaryKeys?.[i]
            )
          : targetKey - cursor.keys[i];
      if (cmp < 0) {
        childIdx = i;
        break;
      }
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `Periksa Internal Node (${cursor.id})`,
      explanation: `Mencari ${targetLabel}: membandingkan dengan separator key [${cursor.keys
        .map((k, idx) => formatEntryLabel(k, cursor.secondaryKeys?.[idx]))
        .join(' | ')}]. Mengarahkan pencarian ke cabang #${childIdx + 1}.`,
      activeNodeId: cursor.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [],
      matchedEntryKeys: [],
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: comparisons,
        tuplesMatched: 0,
        scanStrategy: 'Index Scan (Equality =)',
      },
    });

    cursor = cursor.children[childIdx];
  }

  visited.push(cursor.id);
  const matchedEntries: BTreeEntry[] = [];
  for (const e of cursor.entries) {
    comparisons++;
    const isMatch =
      targetSecondaryKey !== undefined
        ? e.key === targetKey && e.secondaryKey === targetSecondaryKey
        : e.key === targetKey;
    if (isMatch) {
      matchedEntries.push(e);
    }
  }

  steps.push({
    stepIndex: steps.length + 1,
    title:
      matchedEntries.length > 0
        ? `Ditemukan pada Leaf Node (${cursor.id})`
        : `Tidak Ditemukan pada Leaf Node (${cursor.id})`,
    explanation:
      matchedEntries.length > 0
        ? `Key ${targetLabel} ditemukan di Leaf Node ${cursor.id}! Mengambil tuple pointer ${matchedEntries
            .map((m) => m.ctid)
            .join(', ')} (${matchedEntries[0].rowSummary}).`
        : `Pencarian tiba di Leaf Node ${cursor.id}, namun key ${targetLabel} tidak ada di dalam slot [${cursor.entries
            .map((e) => e.label)
            .join(', ')}]. Pencarian berhenti dengan 0 baris dikembalikan.`,
    activeNodeId: cursor.id,
    visitedNodeIds: [...visited],
    matchedNodeIds: matchedEntries.length > 0 ? [cursor.id] : [],
    matchedEntryKeys: matchedEntries.map((m) => m.label),
    treeSnapshot: cloneTree(root),
    metrics: {
      nodesVisited: visited.length,
      keyComparisons: comparisons,
      tuplesMatched: matchedEntries.length,
      scanStrategy: 'Index Scan (Equality =)',
    },
  });

  return {
    root,
    steps,
    foundEntries: matchedEntries,
  };
}

/**
 * Range Search (WHERE key BETWEEN minKey AND maxKey)
 * Demonstrates tree descent to start leaf + horizontal sibling traversal across leaf nodes.
 */
export function searchBTreeRange(
  root: BTreeNode,
  minKey: number,
  maxKey: number
): BTreeSimulationResult {
  const low = Math.min(minKey, maxKey);
  const high = Math.max(minKey, maxKey);
  const steps: BTreeTraceStep[] = [];
  const visited: string[] = [];
  const matchedNodes: string[] = [];
  const matchedLabels: string[] = [];
  const foundEntries: BTreeEntry[] = [];
  let comparisons = 0;

  // Map all leaves by ID for horizontal pointer traversal
  const leafMap = new Map<string, BTreeNode>();
  function collectLeaves(n: BTreeNode) {
    if (n.isLeaf) {
      leafMap.set(n.id, n);
    } else {
      n.children.forEach(collectLeaves);
    }
  }
  collectLeaves(root);

  let cursor = root;
  while (!cursor.isLeaf) {
    visited.push(cursor.id);
    let childIdx = cursor.keys.length;
    for (let i = 0; i < cursor.keys.length; i++) {
      comparisons++;
      if (low < cursor.keys[i]) {
        childIdx = i;
        break;
      }
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `Cari Batas Bawah (${low}) di ${cursor.id}`,
      explanation: `Range Query BETWEEN ${low} AND ${high}: menelusuri pohon untuk menemukan titik awal rentang (${low}). Turun ke cabang #${childIdx + 1}.`,
      activeNodeId: cursor.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [],
      matchedEntryKeys: [],
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: comparisons,
        tuplesMatched: 0,
        scanStrategy: 'Index Range Scan (Tree Descent)',
      },
    });

    cursor = cursor.children[childIdx];
  }

  // Horizontal scan across leaves using nextLeafId
  let currentLeaf: BTreeNode | undefined = cursor;
  let prevLeafId: string | null = null;

  while (currentLeaf) {
    visited.push(currentLeaf.id);
    let exceededUpperBound = false;
    const leafMatches: BTreeEntry[] = [];

    for (const entry of currentLeaf.entries) {
      comparisons++;
      if (entry.key >= low && entry.key <= high) {
        leafMatches.push(entry);
        foundEntries.push(entry);
        matchedLabels.push(entry.label);
      } else if (entry.key > high) {
        exceededUpperBound = true;
        break;
      }
    }

    if (leafMatches.length > 0) {
      matchedNodes.push(currentLeaf.id);
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: prevLeafId
        ? `Horizontal Leaf Scan (${prevLeafId} → ${currentLeaf.id})`
        : `Periksa Leaf Awal (${currentLeaf.id})`,
      explanation: prevLeafId
        ? `Mengikuti sibling pointer horizontal ke Leaf ${currentLeaf.id} tanpa kembali ke Root! Ditemukan ${leafMatches.length} key dalam rentang [${low}, ${high}]${
            exceededUpperBound
              ? `. Karena menemukan key > ${high}, pemindaian rentang selesai.`
              : '.'
          }`
        : `Memulai pemindaian di Leaf ${currentLeaf.id} untuk nilai >= ${low}. Ditemukan ${leafMatches.length} key yang cocok.`,
      activeNodeId: currentLeaf.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [...matchedNodes],
      matchedEntryKeys: [...matchedLabels],
      horizontalLinkFromId: prevLeafId,
      horizontalLinkToId: prevLeafId ? currentLeaf.id : null,
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: comparisons,
        tuplesMatched: foundEntries.length,
        scanStrategy: 'Index Range Scan (Leaf Linked-List)',
      },
    });

    if (exceededUpperBound || !currentLeaf.nextLeafId) {
      break;
    }
    prevLeafId = currentLeaf.id;
    currentLeaf = leafMap.get(currentLeaf.nextLeafId);
  }

  return {
    root,
    steps,
    foundEntries,
  };
}

/**
 * Sorting Traversal (ORDER BY key ASC / DESC)
 */
export function traverseBTreeOrder(
  root: BTreeNode,
  direction: 'ASC' | 'DESC' = 'ASC'
): BTreeSimulationResult {
  const steps: BTreeTraceStep[] = [];
  const visited: string[] = [];
  const matchedNodes: string[] = [];
  const matchedLabels: string[] = [];
  const foundEntries: BTreeEntry[] = [];

  const leaves: BTreeNode[] = [];
  function collectLeaves(n: BTreeNode) {
    if (n.isLeaf) leaves.push(n);
    else n.children.forEach(collectLeaves);
  }
  collectLeaves(root);

  const orderedLeaves = direction === 'ASC' ? leaves : [...leaves].reverse();

  // Descent to leftmost (ASC) or rightmost (DESC) leaf
  let cursor = root;
  while (!cursor.isLeaf) {
    visited.push(cursor.id);
    const nextChild =
      direction === 'ASC'
        ? cursor.children[0]
        : cursor.children[cursor.children.length - 1];
    steps.push({
      stepIndex: steps.length + 1,
      title: `Menuju Ujung ${direction === 'ASC' ? 'Kiri (Minimum)' : 'Kanan (Maksimum)'}`,
      explanation: `ORDER BY ${direction}: menelusuri cabang paling ${
        direction === 'ASC' ? 'kiri' : 'kanan'
      } dari ${cursor.id} untuk memulai pembacaan data yang sudah terurut di Leaf.`,
      activeNodeId: cursor.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [],
      matchedEntryKeys: [],
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: 0,
        tuplesMatched: 0,
        scanStrategy: `Index Scan Backward/Forward (ORDER BY ${direction})`,
      },
    });
    cursor = nextChild;
  }

  for (let i = 0; i < orderedLeaves.length; i++) {
    const leaf = orderedLeaves[i];
    visited.push(leaf.id);
    matchedNodes.push(leaf.id);
    const leafEntries =
      direction === 'ASC' ? leaf.entries : [...leaf.entries].reverse();
    for (const e of leafEntries) {
      foundEntries.push(e);
      matchedLabels.push(e.label);
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `Baca Berurutan Leaf ${leaf.id} (${direction})`,
      explanation: `Membaca key [${leafEntries
        .map((e) => e.label)
        .join(' → ')}] langsung dari Leaf ${leaf.id}. PostgreSQL tidak perlu menjalankan operasi Sort tambahan di memori!`,
      activeNodeId: leaf.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [...matchedNodes],
      matchedEntryKeys: [...matchedLabels],
      horizontalLinkFromId: i > 0 ? orderedLeaves[i - 1].id : null,
      horizontalLinkToId: i > 0 ? leaf.id : null,
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: foundEntries.length,
        tuplesMatched: foundEntries.length,
        scanStrategy: `Index Scan (ORDER BY ${direction} - No Sort Step)`,
      },
    });
  }

  return {
    root,
    steps,
    foundEntries,
  };
}

/**
 * Multicolumn Non-Leading Search Demonstration (WHERE secondaryKey = X without leading column)
 * Shows why omitting the leading column forces scanning across all leaf nodes.
 */
export function searchMulticolumnNonLeading(
  root: BTreeNode,
  targetSecondaryKey: number
): BTreeSimulationResult {
  const steps: BTreeTraceStep[] = [];
  const visited: string[] = [];
  const matchedNodes: string[] = [];
  const matchedLabels: string[] = [];
  const foundEntries: BTreeEntry[] = [];
  let comparisons = 0;

  const leaves: BTreeNode[] = [];
  function collectLeaves(n: BTreeNode) {
    if (n.isLeaf) leaves.push(n);
    else n.children.forEach(collectLeaves);
  }
  collectLeaves(root);

  steps.push({
    stepIndex: 1,
    title: `Leading Column (customer_id) Tidak Disertakan`,
    explanation: `Query hanya memfilter kolom kedua (WHERE staff_id = ${targetSecondaryKey}). Karena B-Tree diurutkan berdasarkan customer_id terlebih dahulu, nilai staff_id = ${targetSecondaryKey} tersebar di berbagai cabang sehingga index perlu memeriksa bagian yang lebih luas (pada PostgreSQL riil, optimizer dapat mempertimbangkan skip scan atau beralih ke Seq Scan).`,
    activeNodeId: root.id,
    visitedNodeIds: [root.id],
    matchedNodeIds: [],
    matchedEntryKeys: [],
    treeSnapshot: cloneTree(root),
    metrics: {
      nodesVisited: 1,
      keyComparisons: 0,
      tuplesMatched: 0,
      scanStrategy: 'Full Leaf Scan / Fallback Seq Scan (Inefficient)',
    },
  });

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    visited.push(leaf.id);
    const hits = leaf.entries.filter((e) => {
      comparisons++;
      return e.secondaryKey === targetSecondaryKey;
    });
    if (hits.length > 0) {
      matchedNodes.push(leaf.id);
      hits.forEach((h) => {
        foundEntries.push(h);
        matchedLabels.push(h.label);
      });
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `Pindai Paksa Leaf ${leaf.id} (${i + 1}/${leaves.length})`,
      explanation: `Memeriksa seluruh entri di ${leaf.id} satu per satu karena tidak terurut berdasarkan staff_id. Ditemukan ${hits.length} kecocokan pada leaf ini.`,
      activeNodeId: leaf.id,
      visitedNodeIds: [...visited],
      matchedNodeIds: [...matchedNodes],
      matchedEntryKeys: [...matchedLabels],
      horizontalLinkFromId: i > 0 ? leaves[i - 1].id : null,
      horizontalLinkToId: i > 0 ? leaf.id : null,
      treeSnapshot: cloneTree(root),
      metrics: {
        nodesVisited: visited.length,
        keyComparisons: comparisons,
        tuplesMatched: foundEntries.length,
        scanStrategy: 'Full Index Leaf Scan (Leading Column Omitted)',
      },
    });
  }

  return {
    root,
    steps,
    foundEntries,
  };
}

/**
 * Delete a key from the B+Tree by rebuilding cleanly from remaining entries
 * while recording the lookup + deletion trace steps.
 */
export function deleteBTreeKey(
  currentRoot: BTreeNode,
  targetKey: number,
  targetSecondaryKey?: number,
  maxKeys: number = 3
): BTreeSimulationResult {
  const allEntries: BTreeEntry[] = [];
  function gather(n: BTreeNode) {
    if (n.isLeaf) {
      allEntries.push(...n.entries);
    } else {
      n.children.forEach(gather);
    }
  }
  gather(currentRoot);

  const searchRes = searchBTreeEquality(currentRoot, targetKey, targetSecondaryKey);
  const targetLabel = formatEntryLabel(targetKey, targetSecondaryKey);

  const remaining = allEntries.filter((e) =>
    targetSecondaryKey !== undefined
      ? !(e.key === targetKey && e.secondaryKey === targetSecondaryKey)
      : e.key !== targetKey
  );

  if (remaining.length === allEntries.length) {
    return searchRes;
  }

  let newRoot = createEmptyBTree();
  for (const item of remaining) {
    newRoot = insertBTree(newRoot, item, maxKeys).root;
  }
  relinkLeaves(newRoot);

  const deleteStep: BTreeTraceStep = {
    stepIndex: searchRes.steps.length + 1,
    title: `Hapus Key ${targetLabel} & Penyeimbangan Pohon`,
    explanation: `Entri ${targetLabel} dihapus dari Leaf Node dan struktur B+Tree diseimbangkan kembali (${remaining.length} entri tersisa).`,
    activeNodeId: newRoot.id,
    visitedNodeIds: searchRes.steps[searchRes.steps.length - 1]?.visitedNodeIds ?? [],
    matchedNodeIds: [],
    matchedEntryKeys: [],
    treeSnapshot: cloneTree(newRoot),
    metrics: {
      nodesVisited: (searchRes.steps[searchRes.steps.length - 1]?.metrics.nodesVisited ?? 1) + 1,
      keyComparisons: searchRes.steps[searchRes.steps.length - 1]?.metrics.keyComparisons ?? 1,
      tuplesMatched: 1,
      scanStrategy: 'B-Tree Delete & Rebalance',
    },
  };

  return {
    root: newRoot,
    steps: [...searchRes.steps, deleteStep],
    foundEntries: [],
  };
}

export const PRESET_SINGLE_BTREE_ENTRIES: BTreeEntry[] = [
  { key: 10, label: '10', ctid: '(0,1)', rowSummary: 'film_id=10 · ALADDIN CALENDAR · $4.99' },
  { key: 20, label: '20', ctid: '(0,2)', rowSummary: 'film_id=20 · AMELIE HELLFIGHTERS · $4.99' },
  { key: 30, label: '30', ctid: '(0,5)', rowSummary: 'film_id=30 · ANYTHING SAVANNAH · $2.99' },
  { key: 40, label: '40', ctid: '(1,1)', rowSummary: 'film_id=40 · ARMY FLINTSTONES · $0.99' },
  { key: 45, label: '45', ctid: '(1,3)', rowSummary: 'film_id=45 · ATTRACTION NEWTON · $4.99' },
  { key: 50, label: '50', ctid: '(1,6)', rowSummary: 'film_id=50 · BAKED CLEOPATRA · $2.99' },
  { key: 60, label: '60', ctid: '(2,2)', rowSummary: 'film_id=60 · BEAST HUNCHBACK · $4.99' },
  { key: 70, label: '70', ctid: '(2,4)', rowSummary: 'film_id=70 · BIKINI BORROWERS · $4.99' },
  { key: 80, label: '80', ctid: '(3,1)', rowSummary: 'film_id=80 · BLANKET BEVERLY · $2.99' },
];

export const PRESET_MULTICOLUMN_BTREE_ENTRIES: BTreeEntry[] = [
  { key: 10, secondaryKey: 1, label: '(10, 1)', ctid: '(0,2)', rowSummary: 'rental_id=101 · customer_id=10, staff_id=1' },
  { key: 10, secondaryKey: 2, label: '(10, 2)', ctid: '(0,7)', rowSummary: 'rental_id=108 · customer_id=10, staff_id=2' },
  { key: 12, secondaryKey: 1, label: '(12, 1)', ctid: '(1,1)', rowSummary: 'rental_id=115 · customer_id=12, staff_id=1' },
  { key: 12, secondaryKey: 2, label: '(12, 2)', ctid: '(1,4)', rowSummary: 'rental_id=121 · customer_id=12, staff_id=2' },
  { key: 15, secondaryKey: 1, label: '(15, 1)', ctid: '(2,1)', rowSummary: 'rental_id=134 · customer_id=15, staff_id=1' },
  { key: 18, secondaryKey: 2, label: '(18, 2)', ctid: '(2,5)', rowSummary: 'rental_id=142 · customer_id=18, staff_id=2' },
  { key: 22, secondaryKey: 1, label: '(22, 1)', ctid: '(3,2)', rowSummary: 'rental_id=159 · customer_id=22, staff_id=1' },
  { key: 22, secondaryKey: 2, label: '(22, 2)', ctid: '(3,6)', rowSummary: 'rental_id=165 · customer_id=22, staff_id=2' },
];

export function buildPresetBTree(
  entries: BTreeEntry[],
  maxKeys: number = 3
): BTreeNode {
  let root = createEmptyBTree();
  for (const e of entries) {
    root = insertBTree(root, e, maxKeys).root;
  }
  return root;
}

