import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { buildGinInvertedIndex, GinDocument, PRESET_GIN_DOCS, searchGinIndex } from '../../engines/otherIndexEngines';
import { Button, Card, Chip, cx, Field, inputCls, Segmented, Tag } from '../ui/primitives';
import { GinVisualCanvas } from './GinVisualCanvas';

export const GinSimulator: React.FC = () => {
  const [docs, setDocs] = useState<GinDocument[]>(PRESET_GIN_DOCS);
  const [tokens, setTokens] = useState<string[]>(['trailers', 'drama']);
  const [operator, setOperator] = useState<'@>' | '&&'>('@>');
  const [newTitle, setNewTitle] = useState('APOLLO TEEN');
  const [newTokens, setNewTokens] = useState('trailers, commentaries, drama');

  const inverted = buildGinInvertedIndex(docs);
  const res = searchGinIndex(docs, inverted, tokens, operator);
  const matched = new Set(res.matchedDocs.map((d) => d.docId));

  const toggle = (t: string) => setTokens((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const addDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const tk = newTokens
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!newTitle.trim() || tk.length === 0) return;
    const id = docs.length + 1;
    setDocs([...docs, { docId: id, ctid: `(2,${id})`, title: newTitle.trim().toUpperCase(), tokens: tk }]);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<'@>' | '&&'>
            ariaLabel="Operator GIN"
            value={operator}
            onChange={setOperator}
            options={[
              { value: '@>', label: '@> berisi semua' },
              { value: '&&', label: '&& salah satu' },
            ]}
          />
          <Button
            size="sm"
            variant="plain"
            icon={RotateCcw}
            onClick={() => {
              setDocs(PRESET_GIN_DOCS);
              setTokens(['trailers', 'drama']);
            }}
          >
            Reset
          </Button>
        </div>
        <p className="mt-5 text-[13px] font-medium text-ink-2">Token query</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {inverted.map((e) => (
            <Chip key={e.token} active={tokens.includes(e.token)} onClick={() => toggle(e.token)} className="font-mono text-[13px]">
              {e.token}
              <span className={tokens.includes(e.token) ? 'text-white/60' : 'text-ink-3'}>{e.docIds.length}</span>
            </Chip>
          ))}
        </div>
        <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] text-ink-2">
          <span className="mr-2 select-none rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">SQL</span>
          SELECT * FROM film WHERE special_features {operator} ARRAY[{tokens.map((t) => `'${t}'`).join(', ')}];
        </p>
      </Card>

      {/* Visual Inverted Index Canvas */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">
              Diagram Posting List &amp; Bitmap Index Scan
            </h3>
            <p className="text-[12.5px] text-ink-2">
              Setiap token menunjuk ke posting list tuple. Operator {operator} melakukan evaluasi bitmap bitwise untuk menyaring dokumen yang cocok.
            </p>
          </div>
          <Tag tone="ok">{res.matchedDocs.length} baris cocok</Tag>
        </div>
        <GinVisualCanvas
          inverted={inverted}
          docs={docs}
          queriedTokens={tokens}
          operator={operator}
          matchedDocIds={res.matchedDocs.map((d) => d.docId)}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h3 className="text-[17px] font-semibold tracking-tight">Inverted index</h3>
            <span className="text-[13px] text-ink-2">token → posting list</span>
          </div>
          <ul className="divide-y divide-line-soft">
            {inverted.map((e) => {
              const q = tokens.includes(e.token);
              return (
                <li key={e.token} className={cx('-mx-3 flex flex-col gap-2 rounded-xl px-3 py-2.5 sm:flex-row sm:items-center', q && 'bg-accent-soft')}>
                  <button
                    type="button"
                    onClick={() => toggle(e.token)}
                    aria-pressed={q}
                    className={cx('w-44 shrink-0 text-left font-mono text-[14px] font-semibold', q ? 'text-accent' : 'text-ink')}
                  >
                    {e.token}
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {e.docIds.map((id, i) => (
                      <Tag key={id} mono tone={q && matched.has(id) ? 'ok' : q ? 'accent' : 'neutral'}>
                        #{id} {e.ctids[i]}
                      </Tag>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6 lg:col-span-5">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h3 className="text-[17px] font-semibold tracking-tight">Tabel film</h3>
            <span className="text-[13px] font-medium text-ok">{res.matchedDocs.length} baris cocok</span>
          </div>
          <ul className="space-y-2">
            {docs.map((d) => {
              const hit = matched.has(d.docId);
              return (
                <li key={d.docId} className={cx('rounded-2xl p-3.5 transition-colors', hit ? 'bg-ok-soft' : 'bg-fill')}>
                  <div className="flex items-center justify-between gap-2 text-[14px]">
                    <span className={cx('font-semibold', !hit && 'text-ink-2')}>
                      #{d.docId} {d.title}
                    </span>
                    <span className="font-mono text-[12px] text-ink-2">{d.ctid}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.tokens.map((t) => (
                      <Tag key={t} mono tone={tokens.includes(t) ? 'accent' : 'neutral'} className="bg-surface">
                        {t}
                      </Tag>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          <form onSubmit={addDoc} className="mt-5 space-y-3 border-t border-line-soft pt-5">
            <Field label="Judul film">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Elemen array (pisahkan koma)">
              <input value={newTokens} onChange={(e) => setNewTokens(e.target.value)} className={inputCls} />
            </Field>
            <Button type="submit" variant="secondary" icon={Plus}>
              Insert baris
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
