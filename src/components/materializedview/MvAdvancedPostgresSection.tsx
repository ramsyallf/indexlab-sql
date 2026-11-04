import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Layers,
  Database,
  Unlock,
} from 'lucide-react';
import { Card, SectionTitle, CodeBlock, CopyButton } from '../ui/primitives';

interface AdvancedTopic {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  sql: string;
  explanation: React.ReactNode;
}

const ADVANCED_TOPICS: AdvancedTopic[] = [
  {
    id: 'with-data',
    title: 'WITH DATA',
    icon: Database,
    summary: 'Materialized View langsung diisi dengan hasil query seketika saat tabel dibuat.',
    sql: `CREATE MATERIALIZED VIEW sales_summary AS
SELECT
    product,
    COUNT(*) AS total_qty,
    SUM(amount) AS total_sales
FROM sales
GROUP BY product
WITH DATA; -- Opsional, merupakan default di PostgreSQL`,
    explanation: (
      <div className="space-y-2 text-[13.5px] text-ink-2 leading-relaxed text-justify">
        <p>
          Secara default di PostgreSQL, ketika Anda menjalankan <code className="font-mono text-xs text-blue-600 bg-slate-100 px-1 py-0.5 rounded">CREATE MATERIALIZED VIEW</code>, PostgreSQL akan langsung mengeksekusi query di klausa <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">AS</code> dan mengisi data ke relasi fisik.
        </p>
        <p>
          Artinya, segera setelah perintah selesai, Anda dapat langsung melakukan <code className="font-mono text-xs text-blue-600 bg-slate-100 px-1 py-0.5 rounded">SELECT * FROM sales_summary</code> dan mendapatkan data lengkap.
        </p>
      </div>
    ),
  },
  {
    id: 'with-no-data',
    title: 'WITH NO DATA',
    icon: Layers,
    summary: 'Membuat skema Materialized View tanpa langsung mengisi baris datanya.',
    sql: `CREATE MATERIALIZED VIEW sales_summary AS
SELECT
    product,
    COUNT(*) AS total_qty,
    SUM(amount) AS total_sales
FROM sales
GROUP BY product
WITH NO DATA;

-- Mencoba membaca sebelum di-refresh akan menghasilkan pesan error:
-- SELECT * FROM sales_summary;
-- ERROR: materialized view "sales_summary" has not been populated

-- Jalankan refresh untuk mengisi data:
REFRESH MATERIALIZED VIEW sales_summary;`,
    explanation: (
      <div className="space-y-2 text-[13.5px] text-ink-2 leading-relaxed text-justify">
        <p>
          Opsi <code className="font-mono text-xs text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">WITH NO DATA</code> membuat tabel snapshot dalam status belum terisi data.
        </p>
        <p>
          <strong>Kapan ini berguna?</strong> Berguna saat menjalankan skrip migrasi database awal di mana tabel sumber belum memiliki data, atau saat data sumber sangat besar dan Anda ingin menunda pengisian hingga jam sepi agar proses deployment berjalan lancar.
        </p>
      </div>
    ),
  },
  {
    id: 'concurrently',
    title: 'CONCURRENTLY',
    icon: Unlock,
    summary: 'Menyinkronkan data tanpa mengunci query pembacaan yang sedang berlangsung.',
    sql: `-- Langkah 1: Wajib membuat UNIQUE index terlebih dahulu
CREATE UNIQUE INDEX idx_sales_summary_prod
ON sales_summary(product);

-- Langkah 2: Refresh tanpa memblokir pembaca
REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary;`,
    explanation: (
      <div className="space-y-2.5 text-[13.5px] text-ink-2 leading-relaxed text-justify">
        <p>
          Secara default, perintah <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">REFRESH MATERIALIZED VIEW</code> biasa akan mengunci tabel secara eksklusif. Selama refresh berlangsung, query SELECT pembacaan data akan tertahan hingga proses selesai.
        </p>
        <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-3 text-[13px] text-indigo-950 text-justify">
          <strong>Syarat Mutlak PostgreSQL untuk CONCURRENTLY:</strong>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Harus memiliki minimal satu <strong>UNIQUE INDEX</strong> pada kolom Materialized View.</li>
            <li>Index unik tidak boleh berupa partial index dan tidak boleh menggunakan expression.</li>
            <li>Materialized View harus sudah pernah diisi data sebelumnya.</li>
          </ul>
        </div>
        <p>
          <strong>Trade-off:</strong> Mode concurrent membutuhkan sedikit lebih banyak sumber daya dan waktu kalkulasi sedikit lebih panjang, namun mencegah downtime pada sistem aplikasi dengan lalu lintas query yang padat.
        </p>
      </div>
    ),
  },
];

export const MvAdvancedPostgresSection: React.FC = () => {
  const [openTopic, setOpenTopic] = useState<string>('concurrently');

  return (
    <Card className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-soft">
        <div>
          <SectionTitle>Detail Teknis Penting PostgreSQL</SectionTitle>
          <p className="mt-1 text-[14px] text-ink-2 text-justify">
            Fitur lanjutan PostgreSQL seperti inisialisasi tanpa data dan refresh konkuren tanpa mengunci sistem.
          </p>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {ADVANCED_TOPICS.map((topic) => {
          const isOpen = openTopic === topic.id;
          const Icon = topic.icon;

          return (
            <div
              key={topic.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen ? 'border-blue-400 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/60 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenTopic(isOpen ? '' : topic.id)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`p-2 rounded-xl shrink-0 ${
                      isOpen ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-[15.5px] text-ink">{topic.title}</h4>
                    <p className="text-[12.5px] text-ink-2 mt-0.5 text-justify">{topic.summary}</p>
                  </div>
                </div>

                <div className="shrink-0 p-1 text-slate-500">
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-blue-600' : ''
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4"
                  >
                    {topic.explanation}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                        <span>Contoh Sintaks PostgreSQL:</span>
                        <CopyButton text={topic.sql} label="Salin Kode" />
                      </div>
                      <CodeBlock code={topic.sql} className="bg-slate-900 text-slate-100" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
