import React, { useState } from 'react';
import { ArrowDownUp, CheckCircle2, HardDrive, Shuffle, XCircle } from 'lucide-react';
import { buildBrinBlocks, searchBrinRange } from '../../engines/otherIndexEngines';
import { Card, cx, Field, inputCls, Segmented, Stat, Tag } from '../ui/primitives';
import { BrinVisualCanvas } from './BrinVisualCanvas';

export const BrinSimulator: React.FC = () => {
  const [isCorrelated, setIsCorrelated] = useState<boolean>(true);
  const [minVal, setMinVal] = useState<string>('130');
  const [maxVal, setMaxVal] = useState<string>('148');

  const blocks = buildBrinBlocks(isCorrelated);
  const low = Number(minVal) || 130;
  const high = Number(maxVal) || 148;
  const res = searchBrinRange(blocks, low, high);

  const eliminatedSet = new Set(res.eliminatedBlocks);
  const matchedCtidSet = new Set(res.matchedCtids);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<string>
            ariaLabel="Korelasi fisik"
            value={isCorrelated ? 'correlated' : 'random'}
            onChange={(v) => setIsCorrelated(v === 'correlated')}
            options={[
              { value: 'correlated', label: 'Korelasi Tinggi (Terurut Fisik)', icon: ArrowDownUp },
              { value: 'random', label: 'Korelasi Rendah (Acak)', icon: Shuffle },
            ]}
          />
          <span className="text-[13px] text-ink-2">BRIN hanya menyimpan [Min, Max] per blok</span>
        </div>

        <div className="mt-5 border-t border-line-soft pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Batas Bawah" className="w-[calc(50%-6px)] sm:w-36">
              <input
                type="number"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Batas Atas" className="w-[calc(50%-6px)] sm:w-36">
              <input
                type="number"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-ink-2">
            <span className="mr-2 select-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">SQL</span>
            SELECT * FROM rental WHERE rental_id BETWEEN {low} AND {high};
          </p>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Blok Dieliminasi (Skip Heap Scan)"
          value={`${res.eliminatedBlocks.length} / ${blocks.length} Blok`}
          tone={res.eliminatedBlocks.length > 0 ? 'ok' : 'neutral'}
        />
        <Stat
          label="Blok Harus Dipindai (Scan)"
          value={`${res.scannedBlocks.length} / ${blocks.length} Blok`}
          tone={res.scannedBlocks.length === blocks.length ? 'warn' : 'accent'}
        />
        <Stat
          label="Baris Cocok Aktual (Recheck)"
          value={`${res.matchedCtids.length} Baris`}
          tone="accent"
        />
      </div>

      {/* Visual BRIN Storage Canvas */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">
              Arsitektur BRIN: Pemetaan Min-Max &amp; Eliminasi Blok
            </h3>
            <p className="text-[12.5px] text-ink-2">
              Blok dieliminasi berdasarkan ringkasan BRIN sehingga tidak perlu dipindai sebagai bagian dari heap scan untuk query ini ({low}..{high}).
            </p>
          </div>
          <Tag tone={res.eliminatedBlocks.length > 0 ? 'ok' : 'warn'}>
            {res.eliminatedBlocks.length} Blok Dilewati
          </Tag>
        </div>
        <BrinVisualCanvas
          blocks={blocks}
          eliminatedBlocks={res.eliminatedBlocks}
          scannedBlocks={res.scannedBlocks}
          matchedCtids={res.matchedCtids}
          low={low}
          high={high}
        />
      </Card>

      {/* Physical Disk Blocks Grid */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink">
            <HardDrive className="h-4 w-4 text-accent" />
            Blok Fisik Tabel &amp; Ringkasan [Min .. Max]
          </h3>
          <span className="text-[13px] text-ink-2">Halaman disk 8KB (simulasi 4 baris per blok)</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {blocks.map((blk) => {
            const isEliminated = eliminatedSet.has(blk.blockNumber);
            return (
              <div
                key={blk.blockNumber}
                className={cx(
                  'rounded-2xl border p-4 transition-all',
                  isEliminated
                    ? 'border-line-soft bg-fill/50 opacity-60'
                    : 'border-accent/40 bg-accent-soft/30 shadow-card'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-line-soft pb-2.5">
                  <div>
                    <span className="font-mono text-[13px] font-semibold text-ink">
                      Page Block #{blk.blockNumber}
                    </span>
                    <div className="mt-0.5 font-mono text-[12px] text-ink-2">
                      Min: <strong className="text-ink">{blk.minVal}</strong> · Max:{' '}
                      <strong className="text-ink">{blk.maxVal}</strong>
                    </div>
                  </div>
                  {isEliminated ? (
                    <Tag tone="ok" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Eliminated
                    </Tag>
                  ) : (
                    <Tag tone="warn" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Scan Block
                    </Tag>
                  )}
                </div>

                {/* Tuples inside block */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 font-mono text-[12px]">
                  {blk.rows.map((r) => {
                    const isMatch = matchedCtidSet.has(r.ctid);
                    return (
                      <div
                        key={r.ctid}
                        className={cx(
                          'flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors',
                          isMatch
                            ? 'bg-ok-fill text-white font-medium shadow-sm'
                            : isEliminated
                            ? 'bg-fill text-ink-3 line-through'
                            : 'bg-surface text-ink border border-line-soft'
                        )}
                      >
                        <span>{r.value}</span>
                        <span className={cx('text-[10px]', isMatch ? 'text-white/80' : 'text-ink-3')}>
                          {r.ctid}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
