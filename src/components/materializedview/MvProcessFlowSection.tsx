import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Cpu,
  HardDrive,
  Zap,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { Card, SectionTitle, Button } from '../ui/primitives';

interface StageInfo {
  id: number;
  category: 'source' | 'processing' | 'storage' | 'refresh';
  title: string;
  icon: React.ElementType;
  summary: string;
  explanation: string;
  internalAction: string;
  sqlSnippet?: string;
}

const STAGES: StageInfo[] = [
  {
    id: 1,
    category: 'source',
    title: 'Tabel Sumber Berisi Data Asli',
    icon: Database,
    summary: 'Tabel operasional seperti sales atau orders menampung transaksi harian secara detail.',
    explanation:
      'Database PostgreSQL memiliki tabel dasar tempat transaksi baru terus diinput. Tabel ini dapat berisi ribuan hingga puluhan juta baris data mentah.',
    internalAction: 'Tabel dasar diakses menggunakan sequential scan atau index scan biasa.',
    sqlSnippet: 'SELECT * FROM sales LIMIT 5;',
  },
  {
    id: 2,
    category: 'processing',
    title: 'Query SQL Merumuskan Agregasi',
    icon: FileCode,
    summary: 'Query analitik dirancang untuk menghitung rangkuman seperti SUM, COUNT, atau GROUP BY.',
    explanation:
      'Developer atau Data Analyst mendefinisikan query kalkulasi berat yang ingin disimpan, misalnya menghitung total penjualan per kategori atau omzet bulanan.',
    internalAction: 'Query di-parse ke AST dan dioptimalkan oleh Query Planner.',
    sqlSnippet: 'SELECT product, COUNT(*) as qty, SUM(amount) as total FROM sales GROUP BY product;',
  },
  {
    id: 3,
    category: 'processing',
    title: 'PostgreSQL Mengeksekusi & Menghitung Hasil',
    icon: Cpu,
    summary: 'Engine database mengalokasikan CPU dan memori untuk memproses seluruh baris data.',
    explanation:
      'Saat pertama kali perintah CREATE MATERIALIZED VIEW dijalankan, PostgreSQL membaca seluruh baris tabel sumber, menjalankan fungsi agregasi, lalu menghasilkan result set sementara di memori.',
    internalAction: 'PostgreSQL Planner membuat execution plan dan mengeksekusi hash aggregate.',
    sqlSnippet: '-- PostgreSQL menjalankan kalkulasi awal terhadap seluruh baris tabel sumber',
  },
  {
    id: 4,
    category: 'storage',
    title: 'Hasil Disimpan Fisik ke Disk Storage',
    icon: HardDrive,
    summary: 'PostgreSQL menulis baris hasil query ke blok-blok data disk sebagai tabel independen.',
    explanation:
      'Inilah perbedaan krusial dengan regular view: PostgreSQL mengalokasikan relasi fisik bernama Materialized View di storage disk. Data hasil kalkulasi kini berwujud fisik.',
    internalAction: 'Tercatat di sistem katalog PostgreSQL dengan relkind = \'m\' (materialized view).',
    sqlSnippet: 'CREATE MATERIALIZED VIEW sales_summary AS\nSELECT COUNT(*) as total_tx, SUM(amount) as total_sales FROM sales;',
  },
  {
    id: 5,
    category: 'storage',
    title: 'User Membaca Data Snapshot Secara Instan',
    icon: Zap,
    summary: 'Aplikasi membaca data yang sudah matang tanpa menghitung ulang dari nol.',
    explanation:
      'Ketika pengguna mengakses dashboard secara bersamaan, database hanya perlu melakukan scan langsung ke tabel Materialized View yang berukuran ringkas, selesai dalam hitungan milidetik.',
    internalAction: 'Sequential scan pada Materialized View hanya membaca beberapa blok disk.',
    sqlSnippet: 'SELECT * FROM sales_summary;',
  },
  {
    id: 6,
    category: 'source',
    title: 'Data Sumber Berubah, Materialized View Tetap pada Snapshot Lama',
    icon: AlertCircle,
    summary: 'Transaksi baru masuk ke tabel sumber, tetapi Materialized View tidak otomatis terupdate.',
    explanation:
      'PostgreSQL secara sengaja tidak memperbarui Materialized View setiap ada penambahan data di tabel sumber demi mencegah perlambatan transaksi operasional. Akibatnya, data Materialized View menjadi usang.',
    internalAction: 'Tabel sales berubah, namun disk block dari Materialized View tidak disentuh sama sekali.',
    sqlSnippet: 'INSERT INTO sales (product, amount) VALUES (\'Monitor\', 2000000);\n-- Nilai di sales bertambah, tetapi di sales_summary belum berubah',
  },
  {
    id: 7,
    category: 'refresh',
    title: 'Operasi REFRESH Menyinkronkan Kembali Data',
    icon: RefreshCw,
    summary: 'Perintah REFRESH dieksekusi untuk memperbarui snapshot ke versi mutakhir.',
    explanation:
      'Perintah REFRESH MATERIALIZED VIEW menjalankan kembali query dasar pada tabel sumber dan menimpa data lama dengan data baru di storage disk. Status data kini kembali mutakhir.',
    internalAction: 'PostgreSQL mengunci tabel, menghitung ulang query, dan memperbarui data Materialized View.',
    sqlSnippet: 'REFRESH MATERIALIZED VIEW sales_summary;',
  },
];

export const MvProcessFlowSection: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStageId((prev) => (prev >= STAGES.length ? 1 : prev + 1));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <Card className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-soft">
        <div>
          <SectionTitle>Bagaimana Materialized View Bekerja</SectionTitle>
          <p className="mt-1 text-[14px] text-ink-2 text-justify">
            Pelajari siklus hidup data mulai dari tabel sumber, komputasi, penyimpanan fisik di disk, hingga operasi refresh.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="secondary"
            icon={isPlaying ? Pause : Play}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Jeda' : 'Putar Otomatis'}
          </Button>
          <div className="flex items-center gap-1 border-l border-line-soft pl-2">
            <button
              type="button"
              onClick={() => setActiveStageId((prev) => Math.max(1, prev - 1))}
              disabled={activeStageId === 1}
              aria-label="Tahap Sebelumnya"
              className="p-1.5 rounded-lg border border-line-soft hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-ink transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-ink-2">
              {activeStageId} / {STAGES.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveStageId((prev) => Math.min(STAGES.length, prev + 1))}
              disabled={activeStageId === STAGES.length}
              aria-label="Tahap Berikutnya"
              className="p-1.5 rounded-lg border border-line-soft hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-ink transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Step Interactive Pipeline Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map((stage) => {
          const isActive = stage.id === activeStageId;
          const isPassed = stage.id < activeStageId;
          const Icon = stage.icon;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActiveStageId(stage.id);
              }}
              className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between min-h-[88px] ${isActive
                ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : isPassed
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-slate-50/70 border-slate-200/70 text-slate-500 hover:bg-white'
                }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive
                    ? 'bg-blue-600 text-white'
                    : isPassed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  #{stage.id}
                </span>
                <Icon
                  className={`h-4 w-4 ${isActive ? 'text-blue-600' : isPassed ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                />
              </div>

              <div className="mt-2">
                <div
                  className={`text-[12px] line-clamp-2 leading-tight ${isActive ? 'text-blue-950 font-medium' : 'text-ink font-normal'
                    }`}
                >
                  {stage.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Details Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 p-5 sm:p-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Tahap {activeStage.id} dari 7
              </span>

              <h3 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-ink">
                {activeStage.title}
              </h3>

              <p className="text-[14.5px] leading-relaxed text-ink-2 text-justify">
                {activeStage.explanation}
              </p>

              <div className="rounded-xl bg-white border border-slate-200/90 p-3.5 flex items-start gap-2.5 text-[13px] text-ink">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-justify">
                  <strong className="text-ink">Mekanisme Internal PostgreSQL: </strong>
                  <span className="text-ink-2">{activeStage.internalAction}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="rounded-xl bg-slate-900 p-4 font-mono text-[12.5px] text-slate-100 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[11px] text-slate-400">
                  <span>PostgreSQL Query</span>
                  <span className="text-emerald-400">Tahap #{activeStage.id}</span>
                </div>
                <pre className="overflow-x-auto text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  {activeStage.sqlSnippet}
                </pre>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium pt-1">
                <div
                  className={`p-2 rounded-lg border ${activeStage.category === 'source'
                    ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-500'
                    }`}
                >
                  Tabel Sumber
                </div>
                <div
                  className={`p-2 rounded-lg border ${activeStage.category === 'storage'
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-500'
                    }`}
                >
                  Disk Storage
                </div>
                <div
                  className={`p-2 rounded-lg border ${activeStage.category === 'refresh'
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-500'
                    }`}
                >
                  Sinkronisasi
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
};
