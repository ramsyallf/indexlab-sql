import React, { useState } from 'react';
import { HelpCircle, Plus, RotateCcw, Sparkles } from 'lucide-react';
import {
  BloomRowTuple,
  createBloomRowTuple,
  evaluateBloomQuery,
  PRESET_BLOOM_ROWS,
} from '../../engines/otherIndexEngines';
import { Button, Card, cx, Field, inputCls, Note, Select, Tag } from '../ui/primitives';
import { BloomVisualCanvas } from './BloomVisualCanvas';

export const BloomSimulator: React.FC = () => {
  const [rows, setRows] = useState<BloomRowTuple[]>(PRESET_BLOOM_ROWS);
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');
  const [filterStaffId, setFilterStaffId] = useState<string>('2');
  const [filterRating, setFilterRating] = useState<string>('R');

  const [newCustomer, setNewCustomer] = useState<string>('19');
  const [newStaff, setNewStaff] = useState<string>('2');
  const [newRating, setNewRating] = useState<string>('PG-13');

  const evaluation = evaluateBloomQuery(rows, {
    customerId: filterCustomerId !== '' ? Number(filterCustomerId) : null,
    staffId: filterStaffId !== '' ? Number(filterStaffId) : null,
    rating: filterRating !== '' ? filterRating : null,
  });

  const handleAddTuple = (e: React.FormEvent) => {
    e.preventDefault();
    const cId = Number(newCustomer) || 15;
    const sId = Number(newStaff) || 1;
    const nextId = rows.length + 1;
    const tuple = createBloomRowTuple(
      nextId,
      `(3,${nextId})`,
      cId,
      sId,
      newRating || 'PG'
    );
    setRows([...rows, tuple]);
  };

  const triggerFalsePositiveDemo = () => {
    const crafted = createBloomRowTuple(99, '(9,1)', 12, 1, 'R');
    const exists = rows.some((r) => r.rowId === 99);
    const nextRows = exists ? rows : [...rows, crafted];
    setRows(nextRows);
    setFilterCustomerId('12');
    setFilterStaffId('2');
    setFilterRating('R');
  };

  const reset = () => {
    setRows(PRESET_BLOOM_ROWS);
    setFilterCustomerId('');
    setFilterStaffId('2');
    setFilterRating('R');
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-ink">
              Filter Multi-Kolom Fleksibel
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Tidak terikat aturan kolom pertama (leading column) seperti B-Tree
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Sparkles}
              onClick={triggerFalsePositiveDemo}
            >
              Simulasi False Positive
            </Button>
            <Button variant="plain" size="sm" icon={RotateCcw} onClick={reset}>
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line-soft pt-5 sm:grid-cols-3">
          <Field label="customer_id (Opsional)">
            <input
              type="number"
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
              placeholder="Semua nilai"
              className={inputCls}
            />
          </Field>
          <Field label="staff_id (Opsional)">
            <Select<string>
              value={filterStaffId}
              onChange={setFilterStaffId}
              options={[
                { value: '', label: 'Semua nilai' },
                { value: '1', label: 'staff_id = 1' },
                { value: '2', label: 'staff_id = 2' },
              ]}
            />
          </Field>
          <Field label="rating (Opsional)">
            <Select<string>
              value={filterRating}
              onChange={setFilterRating}
              options={[
                { value: '', label: 'Semua rating' },
                { value: 'G', label: 'G' },
                { value: 'PG', label: 'PG' },
                { value: 'PG-13', label: 'PG-13' },
                { value: 'R', label: 'R' },
                { value: 'NC-17', label: 'NC-17' },
              ]}
            />
          </Field>
        </div>

        <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-ink-2">
          <span className="mr-2 select-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">SQL</span>
          SELECT * FROM rental WHERE{' '}
          {[
            filterCustomerId && `customer_id = ${filterCustomerId}`,
            filterStaffId && `staff_id = ${filterStaffId}`,
            filterRating && `rating = '${filterRating}'`,
          ]
            .filter(Boolean)
            .join(' AND ') || 'TRUE (Tanpa filter)'}
          ;
        </p>
      </Card>

      {/* Visual Bloom Filter Architecture Canvas */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">
              Diagram Hashing Multi-Kolom &amp; Signature Bitmask
            </h3>
            <p className="text-[12.5px] text-ink-2">
              Setiap nilai kolom yang difilter dipetakan oleh hash functions ke posisi bit pada 16-bit signature.
            </p>
          </div>
          <Tag tone={evaluation.activeBitIndices.length > 0 ? 'accent' : 'neutral'}>
            {evaluation.activeBitIndices.length} Bit Aktif
          </Tag>
        </div>
        <BloomVisualCanvas
          filterCustomerId={filterCustomerId}
          filterStaffId={filterStaffId}
          filterRating={filterRating}
          targetMask={evaluation.targetMask}
          activeBitIndices={evaluation.activeBitIndices}
        />
      </Card>

      {/* Target Bitmask Indicator */}
      <Card className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink">
            Target Bit Mask (16-Bit Signature)
          </h3>
          <span className="font-mono text-[13px] text-ink-2">
            Bit wajib bernilai 1:{' '}
            <strong className="text-accent">
              {evaluation.activeBitIndices.length > 0
                ? evaluation.activeBitIndices.map((i) => `b${i}`).join(', ')
                : '(Belum ada filter)'}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-16">
          {evaluation.targetMask.map((bit, idx) => (
            <div
              key={idx}
              className={cx(
                'flex flex-col items-center justify-center rounded-xl py-2 font-mono transition-all',
                bit === 1
                  ? 'bg-accent text-white shadow-sm font-semibold'
                  : 'bg-fill text-ink-3'
              )}
            >
              <span className={cx('text-[9px]', bit === 1 ? 'text-white/80' : 'text-ink-3')}>b{idx}</span>
              <span className="text-[14px]">{bit}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Per-Row Evaluation */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink">
            Evaluasi Signature Baris
          </h3>
          <span className="text-[13px] text-ink-2">
            Jika satu saja bit target bernilai 0 → Pasti tidak cocok (Definite No)
          </span>
        </div>

        <div className="space-y-3">
          {evaluation.rowResults.map((res) => {
            const { row, status, missingBits } = res;
            return (
              <div
                key={row.rowId}
                className={cx(
                  'flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-all lg:flex-row lg:items-center',
                  status === 'TRUE_POSITIVE'
                    ? 'border-ok-fill/40 bg-ok-soft/30 shadow-card'
                    : status === 'FALSE_POSITIVE'
                    ? 'border-warn-fill/40 bg-warn-soft/40 shadow-card'
                    : 'border-line-soft bg-surface'
                )}
              >
                {/* Tuple Data */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[13px]">
                  <span className="font-semibold text-ink">#{row.rowId}</span>
                  <Tag tone="neutral" mono>
                    {row.ctid}
                  </Tag>
                  <span className="text-ink-2">
                    cust=<strong className="text-ink">{row.customerId}</strong>
                  </span>
                  <span className="text-ink-2">
                    staff=<strong className="text-ink">{row.staffId}</strong>
                  </span>
                  <span className="text-ink-2">
                    rating=<strong className="text-ink">'{row.rating}'</strong>
                  </span>
                </div>

                {/* 16-Bit Bar */}
                <div className="grid grid-cols-16 gap-1">
                  {row.signatureBits.map((bit, bIdx) => {
                    const isQueried = evaluation.targetMask[bIdx] === 1;
                    return (
                      <div
                        key={bIdx}
                        className={cx(
                          'flex h-7 w-6 items-center justify-center rounded-md font-mono text-[11px] font-medium transition-colors',
                          isQueried && bit === 1
                            ? 'bg-ok-fill text-white'
                            : isQueried && bit === 0
                            ? 'bg-bad-fill text-white'
                            : bit === 1
                            ? 'bg-ink text-white'
                            : 'bg-fill text-ink-3'
                        )}
                        title={`Bit #${bIdx}: ${bit}`}
                      >
                        {bit}
                      </div>
                    );
                  })}
                </div>

                {/* Status Badge */}
                <div className="w-52 shrink-0 text-left lg:text-right">
                  {status === 'TRUE_POSITIVE' && (
                    <Tag tone="ok">True Match (Lolos Recheck)</Tag>
                  )}
                  {status === 'FALSE_POSITIVE' && (
                    <Tag tone="warn">False Positive (Dibuang saat Recheck)</Tag>
                  )}
                  {status === 'DEFINITE_NO' && (
                    <Tag tone="neutral">
                      Definite No (b{missingBits[0]}=0)
                    </Tag>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Tuple */}
        <form onSubmit={handleAddTuple} className="mt-5 flex flex-wrap items-end gap-3 border-t border-line-soft pt-5">
          <Field label="cust_id" className="w-24">
            <input
              type="number"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="staff_id" className="w-24">
            <input
              type="number"
              value={newStaff}
              onChange={(e) => setNewStaff(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="rating" className="w-28">
            <select
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              className={inputCls}
            >
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="NC-17">NC-17</option>
            </select>
          </Field>
          <Button type="submit" variant="secondary" icon={Plus}>
            Tambah Baris
          </Button>
        </form>
      </Card>

      <Note tone="accent" icon={HelpCircle} title="Bagaimana Bloom Mengatasi Limitasi Multicolumn B-Tree?">
        Pada Bloom Index, setiap kolom memiliki fungsi hash tersendiri yang menyalakan bit tertentu di signature. Pengguna dapat memfilter kolom mana saja (misal hanya staff_id dan rating) tanpa harus menyertakan leading column customer_id. Jika signature cocok, PostgreSQL melakukan pembacaan ulang (Bitmap Heap Scan Recheck) untuk memverifikasi kecocokan sebenarnya dan menyaring False Positive.
      </Note>
    </div>
  );
};
