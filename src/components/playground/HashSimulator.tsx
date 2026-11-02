import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Info, Plus, RotateCcw, Search, X } from 'lucide-react';
import {
  buildHashBuckets,
  computePostgresStyleHash,
  HashTraceStep,
  PRESET_HASH_ITEMS,
  searchHashIndex,
} from '../../engines/otherIndexEngines';
import { Button, Card, cx, Field, inputCls, Note, Segmented, StepPlayer, Tag } from '../ui/primitives';
import { HashVisualCanvas } from './HashVisualCanvas';

type Op = 'search' | 'insert' | 'range';

export const HashSimulator: React.FC = () => {
  const [items, setItems] = useState(PRESET_HASH_ITEMS);
  const [op, setOp] = useState<Op>('search');
  const [searchKey, setSearchKey] = useState('NC-17');
  const [insertKey, setInsertKey] = useState('PG-13-EXT');
  const [steps, setSteps] = useState<HashTraceStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [rangeTried, setRangeTried] = useState(false);

  const buckets = buildHashBuckets(items, 8);
  const current = steps[stepIdx] ?? null;
  const preview = computePostgresStyleHash(searchKey || 'NC-17', 8);

  const showTrace = (s: HashTraceStep[]) => {
    setSteps(s);
    setStepIdx(s.length - 1);
  };

  const search = (key: string) => {
    setRangeTried(false);
    const k = key.trim();
    if (!k) return;
    showTrace(searchHashIndex(buckets, k).steps);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (op === 'search') return search(searchKey);
    if (op === 'insert') {
      const k = insertKey.trim();
      if (!k) return;
      const ctid = `(${Math.floor(Math.random() * 4)},${Math.floor(Math.random() * 8) + 1})`;
      const next = [...items.filter((i) => i.key !== k), { key: k, ctid, rowInfo: `film · key=${k}` }];
      setItems(next);
      setSearchKey(k);
      showTrace(searchHashIndex(buildHashBuckets(next, 8), k).steps);
      return;
    }
    setSteps([]);
    setRangeTried(true);
  };

  const reset = () => {
    setItems(PRESET_HASH_ITEMS);
    setSteps([]);
    setRangeTried(false);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<Op>
            ariaLabel="Operasi hash"
            value={op}
            onChange={(o) => {
              setOp(o);
              setRangeTried(false);
            }}
            options={[
              { value: 'search', label: 'Cari =' },
              { value: 'insert', label: 'Insert' },
              { value: 'range', label: 'Uji range' },
            ]}
          />
          <Button size="sm" variant="plain" icon={RotateCcw} onClick={reset}>
            Reset
          </Button>
        </div>

        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
          {op === 'search' && (
            <>
              <Field label="rating / kode" className="w-48">
                <input value={searchKey} onChange={(e) => setSearchKey(e.target.value)} className={inputCls} />
              </Field>
              <Button type="submit" variant="primary" icon={Search}>
                Lookup
              </Button>
            </>
          )}
          {op === 'insert' && (
            <>
              <Field label="Nilai baru" hint="Coba beberapa nilai untuk memicu collision." className="w-56">
                <input value={insertKey} onChange={(e) => setInsertKey(e.target.value)} className={inputCls} />
              </Field>
              <Button type="submit" variant="primary" icon={Plus}>
                Insert
              </Button>
            </>
          )}
          {op === 'range' && (
            <>
              <p className="max-w-[52ch] text-[15px] text-ink-2">
                Jalankan <span className="font-mono text-ink">WHERE rating BETWEEN 'G' AND 'R'</span> pada hash index.
              </p>
              <Button type="submit" variant="primary">
                Coba jalankan
              </Button>
            </>
          )}
        </form>

        {rangeTried && (
          <Note tone="bad" icon={AlertTriangle} title="Hash index tidak dapat dipakai" className="mt-4" role="alert">
            Fungsi hash mengacak urutan nilai, sehingga nilai yang berdekatan tidak disimpan bersebelahan. Range, BETWEEN, dan
            ORDER BY selalu jatuh ke Seq Scan.
          </Note>
        )}
      </Card>

      {/* Hash pipeline */}
      <Card className="grid gap-px overflow-hidden bg-line-soft p-0 sm:grid-cols-3">
        {[
          { label: 'Input key', value: `"${searchKey || 'NC-17'}"`, cls: 'text-ink' },
          { label: 'hashtext() 32-bit', value: preview.hashHex, cls: 'text-indigo' },
          { label: 'hash mod 8', value: `Bucket ${preview.bucketIndex}`, cls: 'text-accent' },
        ].map((s) => (
          <div key={s.label} className="bg-surface px-6 py-5">
            <div className="text-[13px] text-ink-2">{s.label}</div>
            <div className={cx('mt-1 truncate font-mono text-[20px] font-semibold tracking-tight', s.cls)}>{s.value}</div>
          </div>
        ))}
      </Card>

      {/* Visual Data Structure Canvas */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">
              Visualisasi Struktur Hash Table &amp; Overflow Chain
            </h3>
            <p className="text-[12.5px] text-ink-2">
              Bucket directory menampung pointer ke halaman page. Collision dihubungkan lewat pointer berantai.
            </p>
          </div>
          <Tag tone="accent">Modulo 8</Tag>
        </div>
        <HashVisualCanvas buckets={buckets} currentStep={current} searchKey={searchKey} />
      </Card>

      {/* Buckets */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight">Bucket directory</h3>
          <span className="text-[13px] text-ink-2">Hanya kode hash 4-byte + ctid yang disimpan</span>
        </div>
        <ul className="divide-y divide-line-soft">
          {buckets.map((b) => {
            const activeBucket = current?.activeBucketIndex === b.bucketIndex;
            return (
              <li
                key={b.bucketIndex}
                className={cx(
                  '-mx-3 flex flex-col gap-2 rounded-xl px-3 py-3 transition-colors sm:flex-row sm:items-center',
                  activeBucket && 'bg-accent-soft'
                )}
              >
                <div className="flex w-44 shrink-0 items-center gap-2">
                  <span className={cx('font-mono text-[14px] font-semibold', activeBucket ? 'text-accent' : 'text-ink')}>
                    Bucket {b.bucketIndex}
                  </span>
                  {b.entries.length > 1 && <Tag tone="warn">Collision</Tag>}
                </div>
                {b.entries.length === 0 ? (
                  <span className="text-[14px] text-ink-3">Kosong</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {b.entries.map((en, idx) => {
                      const matched = current?.matchedEntryKey === en.key;
                      const checked =
                        activeBucket && current?.checkedEntryIndex != null && idx <= current.checkedEntryIndex;
                      return (
                        <React.Fragment key={en.key}>
                          {idx > 0 && <ChevronRight className="h-4 w-4 text-warn-fill" aria-label="overflow" />}
                          <div
                            className={cx(
                              'flex items-center rounded-full pl-1 transition-colors',
                              matched ? 'bg-ok-fill text-white' : checked ? 'bg-warn-soft' : 'bg-fill'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOp('search');
                                setSearchKey(en.key);
                                search(en.key);
                              }}
                              className="flex items-center gap-2 rounded-full px-2.5 py-1.5 font-mono text-[13px]"
                              aria-label={`Cari ${en.key}`}
                            >
                              <span className="font-semibold">{en.key}</span>
                              <span className={matched ? 'text-white/80' : 'text-ink-2'}>{en.ctid}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItems((p) => p.filter((i) => i.key !== en.key));
                                setSteps([]);
                              }}
                              className={cx(
                                'mr-1 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                                matched ? 'hover:bg-white/20' : 'text-ink-2 hover:bg-fill-strong'
                              )}
                              aria-label={`Hapus ${en.key}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <StepPlayer
        total={steps.length}
        index={stepIdx}
        onChange={setStepIdx}
        title={current?.title}
        explanation={current?.explanation}
        idleTitle="Jalankan lookup untuk melihat langkahnya"
        idleText="Klik nilai di bucket mana pun untuk langsung mencarinya."
      />

      <Note tone="neutral" icon={Info} title="Prinsip Hash Indexing &amp; Resolusi Collision di PostgreSQL">
        <p>
          Hash Index PostgreSQL memetakan nilai kolom ke dalam integer 32-bit deterministik menggunakan fungsi hash internal (<code className="font-mono text-[11.5px]">hashtext()</code>). Nomor bucket ditentukan melalui operasi modulo.
        </p>
        <div className="mt-2 space-y-1 border-t border-line-soft/60 pt-2 text-[12.5px] text-ink-2">
          <p>
            • <strong>Hanya Mendukung Equality (=):</strong> Karena fungsi hash mengacak distribusi nilai tanpa mempertahankan urutan data, Hash index tidak dapat memproses query rentang (<code className="font-mono text-[11.5px]">&lt;, &gt;, BETWEEN</code>) maupun <code className="font-mono text-[11.5px]">ORDER BY</code>.
          </p>
          <p>
            • <strong>Collision &amp; Recheck:</strong> Ketika dua nilai berbeda menghasilkan kode hash atau nomor bucket yang sama (hash collision), entri disimpan pada overflow page. PostgreSQL selalu membaca baris tabel heap untuk memverifikasi nilai asli tuple guna memastikan akurasi data.
          </p>
        </div>
      </Note>
    </div>
  );
};
