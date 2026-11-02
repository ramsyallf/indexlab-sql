import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import {
  INDEX_METHODS,
  INDEX_ORDER,
  SQL_EXPLORER_EXAMPLES,
} from '../../data/indexCatalog';
import { IndexTypeId } from '../../types';
import { Card, Chip, CodeBlock, CopyButton, PageHeader, Tag } from '../ui/primitives';

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
      <div className="-mx-3.5 sm:-mx-1 flex gap-2 overflow-x-auto px-3.5 sm:px-1 pb-2 touch-scroll no-scrollbar">
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

              <div className="mt-4 border-t border-line-soft pt-3 text-[13px] text-ink-2">
                <div className="flex items-start gap-2">
                  <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <div>
                    <strong className="text-ink">Rencana Eksekusi: </strong>
                    {item.expectedPlanNote}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
