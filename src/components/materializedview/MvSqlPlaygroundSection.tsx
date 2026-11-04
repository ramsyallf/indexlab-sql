import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Terminal,
  Layers,
  HardDrive,
  RefreshCw,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react';
import { Card, SectionTitle, CodeBlock, CopyButton } from '../ui/primitives';

interface SqlCommandItem {
  id: string;
  command: string;
  title: string;
  icon: React.ElementType;
  sql: string;
  description: string;
  purpose: string;
  expectedResult: string;
  executionFlow: string[];
}

const SQL_COMMANDS: SqlCommandItem[] = [
  {
    id: 'create',
    command: 'Create Materialized View',
    title: 'Membuat Materialized View',
    icon: HardDrive,
    sql: `CREATE MATERIALIZED VIEW sales_summary AS
SELECT
    COUNT(*) AS total_transactions,
    SUM(amount) AS total_sales
FROM sales;`,
    purpose: 'Mengeksekusi query agregasi dan menyimpan hasilnya secara fisik sebagai tabel snapshot di disk PostgreSQL.',
    description:
      'Perintah ini membuat objek relasi baru bernama sales_summary. Secara default, PostgreSQL langsung menjalankan query di klausa AS dan mengisi data ke relasi tersebut.',
    expectedResult: 'SELECT 1 (Tabel snapshot fisik terbuat dan berisi 1 baris agregasi)',
    executionFlow: [
      'PostgreSQL Query Parser memvalidasi sintaks',
      'Query Planner membuat rencana eksekusi pada tabel sales',
      'Executor menghitung COUNT(*) dan SUM(amount)',
      'Data ditulis fisik ke heap storage disk dengan relkind = "m"',
    ],
  },
  {
    id: 'select',
    command: 'Select Data',
    title: 'Membaca Hasil dari Materialized View',
    icon: Search,
    sql: `SELECT *
FROM sales_summary;`,
    purpose: 'Mengambil data agregasi yang telah dihitung sebelumnya secara instan.',
    description:
      'Berbeda dari membaca regular view yang memicu perhitungan ulang tabel sumber, query ke Materialized View diperlakukan seperti query ke tabel fisik biasa tanpa pemindaian ulang tabel sales.',
    expectedResult: 'total_transactions | total_sales\n--------------------+-------------\n                  5 |     8000000',
    executionFlow: [
      'Aplikasi mengirim SELECT * FROM sales_summary',
      'PostgreSQL langsung membaca heap page milik sales_summary',
      'Hasil dikembalikan dalam milidetik (< 1ms)',
      'Tabel sales yang berisi jutaan data tidak disentuh sama sekali',
    ],
  },
  {
    id: 'refresh',
    command: 'Refresh Materialized View',
    title: 'Menyinkronkan Ulang Data (Refresh)',
    icon: RefreshCw,
    sql: `REFRESH MATERIALIZED VIEW sales_summary;`,
    purpose: 'Memperbarui data di Materialized View agar mencerminkan perubahan terbaru pada tabel sumber.',
    description:
      'Karena penambahan data di tabel sales tidak otomatis masuk ke sales_summary, perintah REFRESH ini wajib dieksekusi secara manual atau dijadwalkan.',
    expectedResult: 'REFRESH MATERIALIZED VIEW (Data lama digantikan dengan kalkulasi terbaru)',
    executionFlow: [
      'PostgreSQL memperoleh ExclusiveLock pada Materialized View',
      'Query dasar dijalankan ulang terhadap tabel sales',
      'Storage disk Materialized View ditimpa dengan hasil terbaru',
      'Lock dilepaskan, data siap dibaca dalam kondisi mutakhir',
    ],
  },
  {
    id: 'drop',
    command: 'Drop Materialized View',
    title: 'Menghapus Materialized View',
    icon: Trash2,
    sql: `DROP MATERIALIZED VIEW sales_summary;`,
    purpose: 'Menghapus objek Materialized View beserta seluruh data snapshot dan index fisiknya dari disk.',
    description:
      'Jika laporan sudah tidak digunakan atau ingin mendefinisikan ulang strukturnya, DROP MATERIALIZED VIEW akan membebaskan ruang disk storage yang dialokasikan.',
    expectedResult: 'DROP MATERIALIZED VIEW (Objek dan relasi fisik dihapus dari disk)',
    executionFlow: [
      'Menghapus definisi dari pg_class dan pg_rewrite',
      'Menghapus seluruh file relasi fisik di direktori data PostgreSQL',
      'Menghapus index pendukung yang terikat pada Materialized View',
    ],
  },
  {
    id: 'index',
    command: 'Create Index',
    title: 'Membuat Index pada Materialized View',
    icon: Layers,
    sql: `CREATE INDEX idx_sales_summary_total
ON sales_summary(total_sales);`,
    purpose: 'Membuat struktur index B-Tree pada kolom Materialized View untuk mempercepat filtering dan sorting.',
    description:
      'Keunggulan besar Materialized View dibandingkan Regular View adalah dukungannya terhadap Index fisik. Jika Materialized View memiliki banyak baris ringkasan, index ini membuat pencarian WHERE menjadi O(log N).',
    expectedResult: 'CREATE INDEX (Index B-Tree terbentuk di atas Materialized View)',
    executionFlow: [
      'PostgreSQL memindai kolom total_sales di Materialized View',
      'Membangun struktur pohon B-Tree di disk',
      'Mendaftarkan index ke katalog database pg_index',
      'Query filter WHERE total_sales > ... akan menggunakan Index Scan!',
    ],
  },
];

export const MvSqlPlaygroundSection: React.FC = () => {
  const [activeCommandId, setActiveCommandId] = useState<string>('create');

  const selectedCommand = SQL_COMMANDS.find((c) => c.id === activeCommandId) || SQL_COMMANDS[0];

  return (
    <Card className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-soft">
        <div>
          <SectionTitle>Sintaks & SQL Playground PostgreSQL</SectionTitle>
          <p className="mt-1 text-[14px] text-ink-2 text-justify">
            Kumpulan perintah standar yang digunakan untuk mengelola Materialized View di PostgreSQL.
          </p>
        </div>
      </div>

      {/* Navigation Tabs with Capitalized first letters */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 touch-scroll no-scrollbar">
        {SQL_COMMANDS.map((item) => {
          const isActive = item.id === activeCommandId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveCommandId(item.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.command}</span>
            </button>
          );
        })}
      </div>

      {/* SQL Playground Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCommand.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-5"
        >
          {/* Top Info Banner */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[17px] text-ink">{selectedCommand.title}</h3>
              <p className="text-[13.5px] text-ink-2 mt-0.5 text-justify">{selectedCommand.purpose}</p>
            </div>
            <CopyButton text={selectedCommand.sql} label="Salin Kode SQL" />
          </div>

          {/* Code and Execution Flow Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: CodeBlock and Output */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative">
                <CodeBlock code={selectedCommand.sql} className="bg-slate-900 text-slate-100 border-slate-800" />
              </div>

              {/* Simulated Output Terminal */}
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 font-mono text-[12px] text-slate-300">
                <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-1.5 text-[11px]">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Output Terminal:</span>
                </div>
                <div className="text-emerald-400 whitespace-pre-wrap">{selectedCommand.expectedResult}</div>
              </div>

              <p className="text-[13.5px] leading-relaxed text-ink-2 text-justify pt-1">
                {selectedCommand.description}
              </p>
            </div>

            {/* Right: Flow Pipeline */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-[14.5px] text-ink flex items-center gap-2 border-b border-line-soft pb-2">
                <Sparkles className="h-4 w-4 text-blue-600" /> Alur Eksekusi Database
              </h4>

              <div className="space-y-3">
                {selectedCommand.executionFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-[13px]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-ink-2 pt-0.5">{step}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-[12px] text-slate-600 leading-relaxed text-justify">
                <strong>Tips:</strong> Perhatikan bahwa sintaks Materialized View mirip dengan View biasa, tetapi kata kunci utamanya adalah <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-600">MATERIALIZED</code> dan ketersediaan perintah <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-600">REFRESH</code>.
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
};
