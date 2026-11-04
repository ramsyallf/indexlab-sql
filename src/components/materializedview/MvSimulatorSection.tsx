import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  Plus,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Clock,
  ArrowRight,
  Database,
  Sparkles,
  Info,
  Trash2,
  Zap,
} from 'lucide-react';
import { Card, SectionTitle, Tag, Button } from '../ui/primitives';

export interface Transaction {
  id: number;
  product: string;
  amount: number;
  isNew?: boolean;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, product: 'Laptop', amount: 5000000 },
  { id: 2, product: 'Mouse', amount: 200000 },
  { id: 3, product: 'Keyboard', amount: 500000 },
  { id: 4, product: 'Monitor', amount: 2000000 },
  { id: 5, product: 'Headset', amount: 300000 },
];

export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const MvSimulatorSection: React.FC = () => {
  const [sourceData, setSourceData] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [mvData, setMvData] = useState<{ totalTransactions: number; totalSales: number }>({
    totalTransactions: 5,
    totalSales: 8000000,
  });

  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Saat inisialisasi awal');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [productInput, setProductInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<number | ''>('');
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; tone: 'info' | 'warn' | 'ok' }>>([
    {
      id: 'init',
      time: '00:00',
      text: 'Materialized view "sales_summary" diinisialisasi dengan data 5 transaksi awal (Total: Rp8.000.000).',
      tone: 'ok',
    },
  ]);

  // Compute live source values
  const currentSourceTotal = sourceData.reduce((acc, curr) => acc + curr.amount, 0);
  const currentSourceCount = sourceData.length;

  // Stale detection
  const isStale =
    currentSourceCount !== mvData.totalTransactions || currentSourceTotal !== mvData.totalSales;

  const getTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  };

  const handleAddTransaction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productInput.trim() || amountInput === '' || Number(amountInput) <= 0) return;

    const nextId = sourceData.length > 0 ? Math.max(...sourceData.map((d) => d.id)) + 1 : 1;
    const newTx: Transaction = {
      id: nextId,
      product: productInput.trim(),
      amount: Number(amountInput),
      isNew: true,
    };

    const newSource = [...sourceData, newTx];
    setSourceData(newSource);
    setProductInput('');
    setAmountInput('');
    setShowAddForm(false);

    const now = getTimeString();
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        time: now,
        text: `INSERT transaksi #${nextId}: ${newTx.product} senilai ${formatRupiah(newTx.amount)} ke tabel sales. Perhatikan: Materialized View masih menyimpan hasil lama.`,
        tone: 'warn',
      },
      ...prev.slice(0, 7),
    ]);
  };

  const handleQuickAdd = (product: string, amount: number) => {
    const nextId = sourceData.length > 0 ? Math.max(...sourceData.map((d) => d.id)) + 1 : 1;
    const newTx: Transaction = {
      id: nextId,
      product,
      amount,
      isNew: true,
    };

    setSourceData((prev) => [...prev, newTx]);
    const now = getTimeString();
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        time: now,
        text: `INSERT transaksi #${nextId}: ${product} senilai ${formatRupiah(amount)}. Status Materialized View menjadi data usang.`,
        tone: 'warn',
      },
      ...prev.slice(0, 7),
    ]);
  };

  const handleDeleteTransaction = (id: number) => {
    const target = sourceData.find((t) => t.id === id);
    setSourceData((prev) => prev.filter((t) => t.id !== id));
    const now = getTimeString();
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        time: now,
        text: `DELETE transaksi #${id} (${target?.product || ''}). Data sumber berubah, Materialized View menjadi STALE.`,
        tone: 'warn',
      },
      ...prev.slice(0, 7),
    ]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    const now = getTimeString();

    setTimeout(() => {
      // Recalculate
      const newTotal = sourceData.reduce((acc, curr) => acc + curr.amount, 0);
      const newCount = sourceData.length;

      setMvData({
        totalTransactions: newCount,
        totalSales: newTotal,
      });
      setLastRefreshedAt(now);
      setIsRefreshing(false);

      setLogs((prev) => [
        {
          id: Math.random().toString(),
          time: now,
          text: `REFRESH MATERIALIZED VIEW sales_summary sukses dieksekusi. Data telah disinkronkan (${newCount} transaksi, ${formatRupiah(newTotal)}).`,
          tone: 'ok',
        },
        ...prev.slice(0, 7),
      ]);
    }, 700);
  };

  const handleReset = () => {
    setSourceData(INITIAL_TRANSACTIONS);
    setMvData({
      totalTransactions: 5,
      totalSales: 8000000,
    });
    setLastRefreshedAt('Di-reset ke data awal');
    setIsRefreshing(false);
    setShowAddForm(false);
    setProductInput('');
    setAmountInput('');
    setLogs([
      {
        id: 'reset',
        time: getTimeString(),
        text: 'Simulasi di-reset ke kondisi awal (5 transaksi dasar).',
        tone: 'info',
      },
    ]);
  };

  return (
    <Card className="p-5 sm:p-7 space-y-6 border-blue-200/90 shadow-card">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line-soft">
        <div>
          <SectionTitle>Simulasi Interaktif Materialized View</SectionTitle>
          <p className="mt-1 text-[14px] text-ink-2 text-justify">
            Saat tabel sumber dimodifikasi, Materialized View <strong>tidak berubah otomatis</strong> hingga Anda menekan tombol Refresh!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="sm"
            variant="secondary"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Reset Simulasi
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Tutup Form' : 'Tambah Transaksi'}
          </Button>
        </div>
      </div>

      {/* Quick Add Presets Toolbar for Lecturers */}
      <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2 text-ink-2 font-medium">
          <span>Tambah Cepat</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickAdd('Monitor Gaming', 2000000)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-ink text-xs font-medium shadow-xs transition-colors"
          >
            + Monitor Rp2.000.000
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd('Mechanical Keyboard', 750000)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-ink text-xs font-medium shadow-xs transition-colors"
          >
            + Keyboard Rp750.000
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd('USB Flashdisk 64GB', 150000)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-ink text-xs font-medium shadow-xs transition-colors"
          >
            + Flashdisk Rp150.000
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd('Printer Laser', 3200000)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-ink text-xs font-medium shadow-xs transition-colors"
          >
            + Printer Rp3.200.000
          </button>
        </div>
      </div>

      {/* Add Transaction Inline Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleAddTransaction}
            className="overflow-hidden rounded-2xl border-2 border-blue-400 bg-blue-50/40 p-4 sm:p-5"
          >
            <h4 className="font-bold text-[15px] text-ink mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Input Transaksi Baru ke Tabel <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-blue-200">sales</code>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-ink-2 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  placeholder="Contoh: Monitor Ultrawide"
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] text-ink focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-ink-2 mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 2000000"
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] text-ink font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Simpan
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Dual Panels: Source Table vs Materialized View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Source Table */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <Table className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-[16px] text-ink">Tabel Sumber: <code className="font-mono text-blue-600">sales</code></h4>
                  <span className="text-[12px] text-ink-3">Tabel transaksi operasional</span>
                </div>
              </div>
            </div>

            {/* Source Table rows */}
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[290px] overflow-y-auto no-scrollbar">
                <table className="w-full text-left text-[13px]">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm text-[11.5px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-16">ID</th>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-right">Nominal</th>
                      <th className="py-2 px-2 text-center w-10">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {sourceData.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`transition-colors ${tx.isNew ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50'
                          }`}
                      >
                        <td className="py-2 px-3 font-mono text-slate-500">#{tx.id}</td>
                        <td className="py-2 px-3 text-ink flex items-center gap-1.5">
                          {tx.product}
                          {tx.isNew && (
                            <span className="text-[10px] bg-amber-200 text-amber-800 px-1 py-0.2 rounded font-semibold">
                              Baru
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {sourceData.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              aria-label={`Hapus transaksi #${tx.id}`}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Source Table Summary Footnote */}
              <div className="bg-slate-50/90 border-t border-slate-200 p-3 flex items-center justify-between font-mono text-[13px]">
                <span className="font-sans font-bold text-slate-700">
                  Total Sumber ({currentSourceCount} Transaksi):
                </span>
                <span className="font-bold text-blue-600 text-[14.5px]">
                  {formatRupiah(currentSourceTotal)}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[12px] text-ink-3 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Setiap kali transaksi baru ditambah, baris langsung tercatat di tabel <code>sales</code>.</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Materialized View */}
        <div className="lg:col-span-6 space-y-4">
          <div className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm transition-all ${isStale
            ? 'border-amber-400 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20'
            : 'border-emerald-300 bg-gradient-to-br from-emerald-50/40 via-white to-blue-50/20'
            }`}>
            <div className="flex items-center justify-between pb-3 border-b border-line-soft">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${isStale ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  <HardDrive className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-[16px] text-ink">Materialized View: <code className="font-mono text-indigo-600">sales_summary</code></h4>
                  <span className="text-[12px] text-ink-3">Tersimpan secara fisik di disk storage</span>
                </div>
              </div>

              {isStale ? (
                <Tag tone="warn" className="animate-pulse">Data Usang</Tag>
              ) : (
                <Tag tone="ok">Sinkron</Tag>
              )}
            </div>

            {/* Stored Values Table */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-xs font-medium text-ink-2">Total Transaksi Tersimpan</span>
                <div className="mt-1 font-display text-[22px] font-bold text-ink flex items-baseline gap-2">
                  <span>{mvData.totalTransactions}</span>
                  {isStale && (
                    <span className="text-xs font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Sumber: {currentSourceCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-xs font-medium text-ink-2">Total Penjualan Tersimpan</span>
                <div className="mt-1 font-display text-[17px] sm:text-[20px] font-bold text-indigo-700">
                  {formatRupiah(mvData.totalSales)}
                </div>
                {isStale && (
                  <div className="mt-0.5 text-[11px] font-mono text-amber-700">
                    Sumber: {formatRupiah(currentSourceTotal)}
                  </div>
                )}
              </div>
            </div>

            {/* Stale Alert / In-Sync Banner */}
            <div className="mt-4">
              {isStale ? (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 flex items-start gap-3 text-[13px] text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                      Perhatian: Materialized View Mengandung Data Usang
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-justify">
                      Tabel sumber telah menerima transaksi baru, namun Materialized View masih menyimpan hasil dari snapshot sebelumnya.
                      Selisih nilai: <strong className="font-mono text-amber-950">{formatRupiah(Math.abs(currentSourceTotal - mvData.totalSales))}</strong> — {Math.abs(currentSourceCount - mvData.totalTransactions)} transaksi baru belum tercatat.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 text-[13px] text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Data telah sinkron dengan Sumber.</span>
                    <p className="text-[12px] text-emerald-800">
                      Terakhir di-refresh: {lastRefreshedAt}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Action Area */}
            <div className="mt-5 pt-4 border-t border-line-soft flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-ink-3">
                Perintah SQL: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">REFRESH MATERIALIZED VIEW sales_summary;</code>
              </div>

              <Button
                variant="primary"
                icon={RefreshCw}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`w-full sm:w-auto ${isRefreshing ? 'animate-pulse' : ''}`}
              >
                {isRefreshing ? 'Mengkalkulasi Ulang...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Event Logs */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-4 sm:p-5 font-mono text-[12.5px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="h-4 w-4 text-amber-400" /> Log Aktivitas Simulasi PostgreSQL
          </div>
          <span className="text-[11px] text-slate-400">Menampilkan {logs.length} event terakhir</span>
        </div>
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500 shrink-0">[{log.time}]</span>
              <span
                className={
                  log.tone === 'ok'
                    ? 'text-emerald-400'
                    : log.tone === 'warn'
                      ? 'text-amber-300'
                      : 'text-blue-300'
                }
              >
                &gt; {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

