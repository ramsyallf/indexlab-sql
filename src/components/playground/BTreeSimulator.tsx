import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, ArrowUpDown, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import {
  BTreeEntry,
  BTreeNode,
  BTreeTraceStep,
  buildPresetBTree,
  deleteBTreeKey,
  formatEntryLabel,
  insertBTree,
  PRESET_MULTICOLUMN_BTREE_ENTRIES,
  PRESET_SINGLE_BTREE_ENTRIES,
  searchBTreeEquality,
  searchBTreeRange,
  searchMulticolumnNonLeading,
  traverseBTreeOrder,
} from '../../engines/btreeEngine';
import { BTreeCanvas } from './BTreeCanvas';
import { Button, Card, Field, inputCls, Segmented, Stat, StepPlayer, Tag } from '../ui/primitives';

type Mode = 'single' | 'multicolumn';
type Op = 'search' | 'range' | 'insert' | 'sort' | 'delete';

const OP_OPTIONS: Array<{ value: Op; label: string }> = [
  { value: 'search', label: 'Cari' },
  { value: 'range', label: 'Range' },
  { value: 'insert', label: 'Insert' },
  { value: 'sort', label: 'ORDER BY' },
  { value: 'delete', label: 'Delete' },
];

interface BTreeSimulatorProps {
  mode?: Mode;
}

export const BTreeSimulator: React.FC<BTreeSimulatorProps> = ({ mode = 'single' }) => {
  const [maxKeys, setMaxKeys] = useState(3);
  const [root, setRoot] = useState<BTreeNode>(() =>
    buildPresetBTree(mode === 'multicolumn' ? PRESET_MULTICOLUMN_BTREE_ENTRIES : PRESET_SINGLE_BTREE_ENTRIES, 3)
  );
  const [op, setOp] = useState<Op>('search');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');

  const [steps, setSteps] = useState<BTreeTraceStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [found, setFound] = useState<BTreeEntry[]>([]);

  const [k1, setK1] = useState(mode === 'multicolumn' ? '12' : '45');
  const [k2, setK2] = useState('2');
  const [insertKey, setInsertKey] = useState(mode === 'multicolumn' ? '14' : '42');
  const [rangeMin, setRangeMin] = useState(mode === 'multicolumn' ? '11' : '25');
  const [rangeMax, setRangeMax] = useState(mode === 'multicolumn' ? '18' : '65');

  const isMulti = mode === 'multicolumn';

  const loadPreset = (m: Mode, keys: number) => {
    setRoot(buildPresetBTree(m === 'multicolumn' ? PRESET_MULTICOLUMN_BTREE_ENTRIES : PRESET_SINGLE_BTREE_ENTRIES, keys));
    setSteps([]);
    setStepIdx(0);
    setIsPlaying(false);
    setFound([]);
    if (m === 'multicolumn') {
      setK1('12');
      setK2('2');
      setInsertKey('14');
      setRangeMin('11');
      setRangeMax('18');
    } else {
      setK1('45');
      setInsertKey('42');
      setRangeMin('25');
      setRangeMax('65');
    }
  };

  useEffect(() => {
    loadPreset(mode, maxKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    if (stepIdx >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIdx((p) => Math.min(steps.length - 1, p + 1)), 900);
    return () => clearTimeout(t);
  }, [isPlaying, stepIdx, steps]);

  const startTrace = (s: BTreeTraceStep[], matched: BTreeEntry[]) => {
    setSteps(s);
    setStepIdx(0);
    setFound(matched);
    setIsPlaying(true);
  };

  const sec = () => (isMulti ? parseInt(k2, 10) || 1 : undefined);

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    if (op === 'search') {
      const k = parseInt(k1, 10);
      if (Number.isNaN(k)) return;
      const r = searchBTreeEquality(root, k, sec());
      startTrace(r.steps, r.foundEntries);
    } else if (op === 'range') {
      const a = parseInt(rangeMin, 10);
      const b = parseInt(rangeMax, 10);
      if (Number.isNaN(a) || Number.isNaN(b)) return;
      const r = searchBTreeRange(root, a, b);
      startTrace(r.steps, r.foundEntries);
    } else if (op === 'insert') {
      const k = parseInt(insertKey, 10);
      if (Number.isNaN(k)) return;
      const s = sec();
      const ctid = `(${Math.floor(Math.random() * 4)},${Math.floor(Math.random() * 8) + 1})`;
      const r = insertBTree(
        root,
        {
          key: k,
          secondaryKey: s,
          label: formatEntryLabel(k, s),
          ctid,
          rowSummary: isMulti ? `rental · customer_id=${k}, staff_id=${s}` : `film · film_id=${k}`,
        },
        maxKeys
      );
      setRoot(r.root);
      startTrace(r.steps, r.foundEntries);
    } else if (op === 'sort') {
      const r = traverseBTreeOrder(root, sortDir);
      startTrace(r.steps, r.foundEntries);
    } else {
      const k = parseInt(k1, 10);
      if (Number.isNaN(k)) return;
      const r = deleteBTreeKey(root, k, sec(), maxKeys);
      setRoot(r.root);
      startTrace(r.steps, r.foundEntries);
    }
  };

  const runNonLeading = () => {
    const r = searchMulticolumnNonLeading(root, parseInt(k2, 10) || 2);
    startTrace(r.steps, r.foundEntries);
  };

  const table = isMulti ? 'rental' : 'film';
  const col = isMulti ? 'customer_id' : 'film_id';
  const sqlPreview = {
    search: isMulti
      ? `SELECT * FROM rental WHERE customer_id = ${k1} AND staff_id = ${k2};`
      : `SELECT * FROM film WHERE film_id = ${k1};`,
    range: `SELECT * FROM ${table} WHERE ${col} BETWEEN ${rangeMin} AND ${rangeMax};`,
    insert: isMulti
      ? `INSERT INTO rental (customer_id, staff_id, ...) VALUES (${insertKey}, ${k2}, ...);`
      : `INSERT INTO film (film_id, ...) VALUES (${insertKey}, ...);`,
    sort: isMulti
      ? `SELECT * FROM rental ORDER BY customer_id ${sortDir}, staff_id ${sortDir};`
      : `SELECT * FROM film ORDER BY film_id ${sortDir};`,
    delete: `DELETE FROM ${table} WHERE ${col} = ${k1}${isMulti ? ` AND staff_id = ${k2}` : ''};`,
  }[op];

  const keyField = (value: string, set: (v: string) => void, label = col) => (
    <Field label={label} className="w-32">
      <input type="number" inputMode="numeric" value={value} onChange={(e) => set(e.target.value)} className={inputCls} />
    </Field>
  );
  const staffField = isMulti && keyField(k2, setK2, 'staff_id');

  const active = steps[stepIdx] ?? null;

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">
              {isMulti ? 'Multicolumn B-Tree (customer_id, staff_id)' : 'Single-Column B-Tree (film_id)'}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-2">
              {isMulti
                ? 'Composite key terurut leksikografis · Wajib menyertakan leading column untuk index scan optimal'
                : 'Key integer tunggal terurut Lehman & Yao B-link tree dengan right-link sibling pointer'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-ink-2 font-medium">Kapasitas node:</span>
            <Segmented<number>
              size="sm"
              ariaLabel="Kapasitas key per node"
              value={maxKeys}
              onChange={(k) => {
                setMaxKeys(k);
                loadPreset(mode, k);
              }}
              options={[
                { value: 3, label: '3 key' },
                { value: 4, label: '4 key' },
              ]}
            />
            <Button size="sm" variant="plain" icon={RotateCcw} onClick={() => loadPreset(mode, maxKeys)}>
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-5 border-t border-line-soft pt-5">
          <Segmented<Op> ariaLabel="Operasi" value={op} onChange={setOp} options={OP_OPTIONS} />

          <form onSubmit={run} className="mt-4 flex flex-wrap items-end gap-3">
            {op === 'search' && (
              <>
                {keyField(k1, setK1)}
                {staffField}
                <Button type="submit" variant="primary" icon={Search}>
                  Cari
                </Button>
                {isMulti && (
                  <Button variant="destructive" onClick={runNonLeading}>
                    Uji tanpa leading column
                  </Button>
                )}
              </>
            )}
            {op === 'range' && (
              <>
                {keyField(rangeMin, setRangeMin, 'Batas bawah')}
                {keyField(rangeMax, setRangeMax, 'Batas atas')}
                <Button type="submit" variant="primary" icon={ArrowRightLeft}>
                  Jalankan range
                </Button>
              </>
            )}
            {op === 'insert' && (
              <>
                {keyField(insertKey, setInsertKey)}
                {staffField}
                <Button type="submit" variant="primary" icon={Plus}>
                  Insert
                </Button>
              </>
            )}
            {op === 'sort' && (
              <>
                <Segmented<'ASC' | 'DESC'>
                  ariaLabel="Arah urutan"
                  value={sortDir}
                  onChange={setSortDir}
                  options={[
                    { value: 'ASC', label: 'ASC' },
                    { value: 'DESC', label: 'DESC' },
                  ]}
                />
                <Button type="submit" variant="primary" icon={ArrowUpDown}>
                  Baca terurut
                </Button>
              </>
            )}
            {op === 'delete' && (
              <>
                {keyField(k1, setK1)}
                {staffField}
                <Button type="submit" variant="destructive" icon={Trash2}>
                  Hapus
                </Button>
              </>
            )}
          </form>

          <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-ink-2">
            <span className="mr-2 select-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">SQL</span>
            {sqlPreview}
          </p>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <BTreeCanvas root={root} currentStep={active} isMulticolumn={isMulti} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <StepPlayer
          className="lg:col-span-2"
          total={steps.length}
          index={stepIdx}
          onChange={(i) => {
            setIsPlaying(false);
            setStepIdx(i);
          }}
          isPlaying={isPlaying}
          onTogglePlay={() => {
            if (stepIdx >= steps.length - 1) setStepIdx(0);
            setIsPlaying((p) => (stepIdx >= steps.length - 1 ? true : !p));
          }}
          title={active?.title}
          explanation={active?.explanation}
          idleTitle="Pilih operasi, lalu jalankan"
          idleText="PostgreSQL menggunakan implementasi B-tree berbasis Lehman–Yao high-concurrency algorithm (B-link tree). Internal node menyimpan separator key dan right-link (sibling pointer) horizontal. Pasangan key dan ctid disimpan di leaf page. Catatan teknis: ctid (block, offset) merupakan heap tuple identifier, bukan alamat fisik permanen (nilainya dapat berubah saat baris di-UPDATE atau di-VACUUM)."
        >
          {found.length > 0 && stepIdx === steps.length - 1 && (
            <div className="mt-4 border-t border-line-soft pt-4">
              <p className="mb-2 text-[13px] font-medium text-ink">Tuple dikembalikan · {found.length} baris (ctid = heap tuple identifier)</p>
              <div className="flex flex-wrap gap-1.5">
                {found.map((f, i) => (
                  <Tag key={`${f.ctid}-${i}`} tone="ok" mono>
                    {f.label} → {f.ctid}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </StepPlayer>

        <Card className="p-5 sm:p-6">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink">Metrik traversal</h3>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Stat label="Node dikunjungi" value={active?.metrics.nodesVisited ?? 0} tone="accent" />
            <Stat label="Perbandingan key" value={active?.metrics.keyComparisons ?? 0} tone="indigo" />
            <Stat label="Tuple cocok" value={active?.metrics.tuplesMatched ?? 0} tone="ok" />
            <Stat label="Strategi" value={active?.metrics.scanStrategy ?? '—'} tone="teal" small />
          </div>
        </Card>
      </div>
    </div>
  );
};
