import React, { useState } from 'react';
import { BookOpen, Terminal } from 'lucide-react';
import {
  INDEX_METHODS,
  INDEX_ORDER,
  SQL_EXPLORER_EXAMPLES,
} from '../../data/indexCatalog';
import { IndexTypeId } from '../../types';
import { Card, Chip, CodeBlock, CopyButton, Note, PageHeader, Tag } from '../ui/primitives';

export const SqlExplorerView: React.FC = () => {
  const [filterIndex, setFilterIndex] = useState<IndexTypeId | 'all'>('all');

  const filtered =
    filterIndex === 'all'
      ? SQL_EXPLORER_EXAMPLES
      : SQL_EXPLORER_EXAMPLES.filter((e) => e.indexType === filterIndex);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SQL Explorer"
        subtitle="Katalog perintah DDL (CREATE INDEX, DROP INDEX, CREATE EXTENSION) dan query pengujian EXPLAIN ANALYZE sesuai materi Indexing PostgreSQL."
      />

      {/* Filter Chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={filterIndex === 'all'} onClick={() => setFilterIndex('all')}>
          Semua ({SQL_EXPLORER_EXAMPLES.length})
        </Chip>
        {INDEX_ORDER.map((id) => (
          <Chip
            key={id}
            active={filterIndex === id}
            onClick={() => setFilterIndex(id)}
          >
            {INDEX_METHODS[id].shortName}
          </Chip>
        ))}
      </div>

      {/* SQL Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filtered.map((item) => {
          const spec = INDEX_METHODS[item.indexType];
          return (
            <Card
              key={item.id}
              className="flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-3">
                  <div className="flex items-center gap-2">
                    <Tag tone="accent">{spec.shortName}</Tag>
                    <Tag tone="neutral">{item.tableContext}</Tag>
                  </div>
                  <CopyButton text={item.sql} label="Salin SQL" />
                </div>

                <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
                  {item.description}
                </p>

                <div className="mt-4">
                  <CodeBlock code={item.sql} />
                </div>
              </div>

              <div className="mt-4 border-t border-line-soft pt-3">
                <Note tone="neutral" icon={Terminal} className="text-[13px]">
                  <strong className="text-ink">Rencana Eksekusi: </strong>
                  {item.expectedPlanNote}
                </Note>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Maintenance & DROP INDEX Reference */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <h3 className="text-[17px] font-semibold tracking-tight text-ink">
            Manajemen &amp; Pemeliharaan Index PostgreSQL
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 font-mono text-[13px]">
          <div className="rounded-2xl bg-fill p-4">
            <div className="mb-1.5 text-[12px] font-sans font-medium text-ink-2">Menghapus Index</div>
            <code className="text-bad">
              DROP INDEX IF EXISTS idx_film_rental_rate;
            </code>
          </div>
          <div className="rounded-2xl bg-fill p-4">
            <div className="mb-1.5 text-[12px] font-sans font-medium text-ink-2">Cek Ukuran Index di Disk</div>
            <code className="text-accent">
              SELECT pg_size_pretty(pg_relation_size('idx_film_rental_rate'));
            </code>
          </div>
          <div className="rounded-2xl bg-fill p-4">
            <div className="mb-1.5 text-[12px] font-sans font-medium text-ink-2">Nonaktifkan Seq Scan (Uji Index)</div>
            <code className="text-ok">
              SET enable_seqscan = OFF;
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
};
