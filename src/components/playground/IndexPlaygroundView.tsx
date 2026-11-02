import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { INDEX_METHODS, INDEX_ORDER } from '../../data/indexCatalog';
import { IndexTypeId } from '../../types';
import { Card, Chip, CodeBlock, CopyButton, PageHeader, Tag } from '../ui/primitives';
import { BTreeSimulator } from './BTreeSimulator';
import { HashSimulator } from './HashSimulator';
import { GinSimulator } from './GinSimulator';
import { GistSimulator } from './GistSimulator';
import { BrinSimulator } from './BrinSimulator';
import { SpGistSimulator } from './SpGistSimulator';
import { BloomSimulator } from './BloomSimulator';

interface Props {
  selectedIndex?: IndexTypeId;
  onSelectIndex?: (id: IndexTypeId) => void;
}

export const IndexPlaygroundView: React.FC<Props> = ({ selectedIndex: propSelected, onSelectIndex }) => {
  const { indexId } = useParams<{ indexId?: string }>();
  const navigate = useNavigate();

  const selectedIndex: IndexTypeId =
    (indexId && INDEX_METHODS[indexId as IndexTypeId])
      ? (indexId as IndexTypeId)
      : (propSelected && INDEX_METHODS[propSelected])
        ? propSelected
        : 'btree';

  const handleSelect = (id: IndexTypeId) => {
    if (onSelectIndex) onSelectIndex(id);
    navigate(`/playground/${id}`);
  };

  const spec = INDEX_METHODS[selectedIndex];

  const simulator = () => {
    switch (selectedIndex) {
      case 'btree':
        return <BTreeSimulator mode="single" />;
      case 'btree_multicolumn':
        return <BTreeSimulator mode="multicolumn" />;
      case 'hash':
        return <HashSimulator />;
      case 'gin':
        return <GinSimulator />;
      case 'gist':
        return <GistSimulator />;
      case 'brin':
        return <BrinSimulator />;
      case 'spgist':
        return <SpGistSimulator />;
      case 'bloom':
        return <BloomSimulator />;
    }
  };

  return (
    <div>
      <PageHeader
        title="Index Playground"
        subtitle="Pilih metode index, jalankan operasi, lalu ikuti langkah demi langkah bagaimana database mengorganisasi dan menemukan data secara visual."
      />

      <nav aria-label="Jenis index" className="-mx-1 mb-10 flex gap-2 overflow-x-auto px-1 pb-2">
        {INDEX_ORDER.map((id) => {
          const m = INDEX_METHODS[id];
          const active = selectedIndex === id;
          return (
            <Chip key={id} active={active} onClick={() => handleSelect(id)}>
              {m.shortName}
            </Chip>
          );
        })}
      </nav>

      {/* Web3 Hero Card (Adapta-Style Gradient Mesh) */}
      <section className="relative mb-10 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#0284C7] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md border border-white/30 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                {spec.badge}
              </span>
            </div>

            <h2 className="mt-4 font-display text-[30px] sm:text-[36px] font-extrabold leading-[1.1] tracking-tight text-white">
              {spec.name}
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15.5px] leading-relaxed text-blue-50/90">
              {spec.summary}
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15">
                <dt className="text-[12px] font-medium text-blue-100">Struktur data</dt>
                <dd className="mt-1 text-[14px] font-semibold text-white">{spec.dataStructureName}</dd>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15">
                <dt className="text-[12px] font-medium text-blue-100">Operator yang didukung</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {spec.supportedOperators.map((op) => (
                    <span
                      key={op}
                      className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[11.5px] font-bold text-white border border-white/25"
                    >
                      {op}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Dark Glass PostgreSQL Terminal */}
          <div className="rounded-2xl bg-slate-900/85 p-5 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                <span className="text-[12.5px] font-semibold text-slate-200">Sintaks PostgreSQL</span>
              </div>
              <CopyButton text={spec.defaultSqlExample} />
            </div>
            <CodeBlock code={spec.defaultSqlExample} className="bg-slate-950/90 border border-slate-800 text-slate-100" />
            <div className="mt-3 flex items-center justify-between text-[11.5px] text-slate-300">
              <span>
                Ukuran: <strong className="text-cyan-300 font-semibold">{spec.storageProfile.relativeSize}</strong>
              </span>
              <span className="text-slate-400">Estimasi konseptual edukatif</span>
            </div>
          </div>
        </div>
      </section>

      {selectedIndex === 'btree' && (
        <div className="mb-8 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-4.5 text-[13.5px] leading-relaxed text-blue-950 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-xs">
              i
            </span>
            <div className="space-y-1.5">
              <p>
                <strong>Catatan Arsitektur B-Tree PostgreSQL:</strong> PostgreSQL mengimplementasikan varian <em>Lehman–Yao high-concurrency B-tree</em> (umumnya disebut sebagai <strong>B-link tree</strong>). Halaman internal dan leaf memiliki <em>high key</em> dan pointer <em>right-link</em> (sibling link) horizontal yang memungkinkan pembaca konkurensi (concurrent readers) langsung bergerak ke halaman saudara kanan saat terjadi page split tanpa mengunci (lock) node induk.
              </p>
              <div className="space-y-1 text-[12.5px] text-blue-900/90 pt-1">
                <p>
                  • <strong>Heap Tuple Identifier (ctid):</strong> Entri daun menyimpan pointer <code className="rounded bg-white/90 px-1.5 py-0.5 font-mono text-[11.5px] text-blue-950 border border-blue-200/60">(block, offset)</code> yang merujuk pada versi baris fisik saat ini di heap tabel. Nilai <code className="font-mono text-[11.5px]">ctid</code> bukan alamat disk permanen karena dapat berubah ketika baris di-UPDATE (MVCC menciptakan tuple versi baru) atau direorganisasi oleh VACUUM.
                </p>
                <p>
                  • <strong>Dukungan Operator LIKE:</strong> Index support untuk prefix matching (<code className="font-mono text-[11.5px]">LIKE 'prefix%'</code>) bergantung pada database collation dan operator class. Pada non-C collation, operator class khusus seperti <code className="rounded bg-white/90 px-1.5 py-0.5 font-mono text-[11.5px] text-blue-950 border border-blue-200/60">text_pattern_ops</code> diperlukan. Pencarian substring tengah seperti <code className="font-mono text-[11.5px]">LIKE '%abc%'</code> umumnya membutuhkan strategi indexing berbeda, seperti <strong>GIN dengan pg_trgm</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {simulator()}
        </motion.div>
      </AnimatePresence>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <Card className="p-6 border-t-4 border-t-emerald-500 bg-gradient-to-br from-emerald-50/20 via-white to-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">Kapan {spec.shortName} cocok</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {spec.suitableQueries.map((q) => (
              <li key={q} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-ink-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                  <Check className="h-3 w-3 stroke-[2.5]" aria-hidden />
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 border-t-4 border-t-rose-500 bg-gradient-to-br from-rose-50/20 via-white to-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <X className="h-4 w-4 stroke-[2.5]" />
            </span>
            <h3 className="text-[17px] font-bold tracking-tight text-ink">Kapan sebaiknya dihindari</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {[...spec.notSuitableFor, ...spec.limitations].map((q) => (
              <li key={q} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-ink-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200/80">
                  <X className="h-3 w-3 stroke-[2.5]" aria-hidden />
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
};
