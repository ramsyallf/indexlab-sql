import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  Terminal,
} from 'lucide-react';
import { INDEX_METHODS, PERF_LAB_SCENARIOS } from '../../data/indexCatalog';
import { simulateQueryPerformance } from '../../engines/otherIndexEngines';
import { IndexTypeId } from '../../types';
import { Card, Field, PageHeader, Select, Stat, Tag } from '../ui/primitives';
import { P } from '../../ui/theme';

const MIN_ROWS = 5000;
const MAX_ROWS = 500000;
const ROW_TICKS = [
  { value: 5000, label: '5k' },
  { value: 100000, label: '100k' },
  { value: 250000, label: '250k' },
  { value: 500000, label: '500k' },
];

export const PerformanceLabView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    PERF_LAB_SCENARIOS[0].id
  );
  const [totalRows, setTotalRows] = useState<number>(100000);
  const [index1, setIndex1] = useState<IndexTypeId>('btree');
  const [index2, setIndex2] = useState<IndexTypeId>('brin');

  const scenario =
    PERF_LAB_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
    PERF_LAB_SCENARIOS[0];

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    const next = PERF_LAB_SCENARIOS.find((s) => s.id === id);
    if (next) {
      setIndex1(next.recommendedIndex);
      setIndex2(next.alternativeIndex);
    }
  };

  const planSeq = simulateQueryPerformance(scenario, totalRows, 'none');
  const planIdx1 = simulateQueryPerformance(scenario, totalRows, index1);
  const planIdx2 = simulateQueryPerformance(scenario, totalRows, index2);

  const plans = [
    { label: 'Sebelum Indexing (Seq Scan)', data: planSeq, defaultTone: 'neutral' as const },
    {
      label: `Index 1: ${INDEX_METHODS[index1].shortName}`,
      data: planIdx1,
      defaultTone: 'ok' as const,
    },
    {
      label: `Index 2: ${INDEX_METHODS[index2].shortName}`,
      data: planIdx2,
      defaultTone: 'accent' as const,
    },
  ];

  const chartData = [
    {
      name: 'Seq Scan',
      'Rows Scanned': planSeq.rowsScanned,
      'Blocks Read': planSeq.blocksRead,
      'Simulated Time (ms)': planSeq.simulatedTimeMs,
      'Index Size (KB)': planSeq.indexSizeKb,
    },
    {
      name: INDEX_METHODS[index1].shortName,
      'Rows Scanned': planIdx1.rowsScanned,
      'Blocks Read': planIdx1.blocksRead,
      'Simulated Time (ms)': planIdx1.simulatedTimeMs,
      'Index Size (KB)': planIdx1.indexSizeKb,
    },
    {
      name: INDEX_METHODS[index2].shortName,
      'Rows Scanned': planIdx2.rowsScanned,
      'Blocks Read': planIdx2.blocksRead,
      'Simulated Time (ms)': planIdx2.simulatedTimeMs,
      'Index Size (KB)': planIdx2.indexSizeKb,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Query Performance Lab"
        subtitle="Simulasi komparatif rencana eksekusi konseptual (EXPLAIN ANALYZE), estimasi baris & blok dipindai, dan estimasi waktu proses antara Sequential Scan dan Index Scan."
      />

      {/* Scenario & Configuration Card */}
      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Scenario & Query */}
          <div className="space-y-4 lg:col-span-6">
            <Field label="1. Pilih Skenario Query (Skema DVD Rental)">
              <Select<string>
                value={selectedScenarioId}
                onChange={handleScenarioChange}
                options={PERF_LAB_SCENARIOS.map((s) => ({
                  value: s.id,
                  label: s.title,
                }))}
              />
            </Field>

            <p className="text-[14px] leading-relaxed text-ink-2 text-justify">
              {scenario.description}
            </p>

            <div className="rounded-2xl bg-fill p-4">
              <div className="mb-2 flex items-center justify-between text-[12px] text-ink-2">
                <span className="font-medium">Query yang Diuji</span>
                <span className="font-mono text-accent">
                  Selektivitas ~{(scenario.selectivityRatio * 100).toFixed(1)}% baris
                </span>
              </div>
              <pre className="overflow-x-auto font-mono text-[12.5px] leading-relaxed text-ink">
                {scenario.sqlQuery}
              </pre>
            </div>
          </div>

          {/* Right Column: Dataset Size & Indexes */}
          <div className="space-y-4 lg:col-span-6">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-ink-2">
                  2. Jumlah Baris Tabel ({totalRows.toLocaleString('id-ID')} Baris)
                </span>
                <span className="font-mono text-[12px] text-ink-3">
                  ~{Math.ceil(totalRows / 40).toLocaleString('id-ID')} Blok Disk (8KB)
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  list="perf-row-milestones"
                  min={MIN_ROWS}
                  max={MAX_ROWS}
                  step={5000}
                  value={totalRows}
                  onChange={(e) => setTotalRows(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <datalist id="perf-row-milestones">
                  {ROW_TICKS.map((t) => (
                    <option key={t.value} value={t.value} />
                  ))}
                </datalist>

                {/* Accurately positioned tick marks and clickable labels */}
                <div className="relative mt-1 h-6 w-full select-none font-mono text-[11px]">
                  {ROW_TICKS.map((tick, idx) => {
                    const ratio = (tick.value - MIN_ROWS) / (MAX_ROWS - MIN_ROWS);
                    const isActive = totalRows === tick.value;
                    const isFirst = idx === 0;
                    const isLast = idx === ROW_TICKS.length - 1;

                    // Exact thumb center in standard range slider:
                    // Thumb center moves from 8px at 0% to (width - 8px) at 100%
                    const leftPos = `calc(8px + ${ratio} * (100% - 16px))`;
                    const transform = isFirst
                      ? 'translateX(-15%)'
                      : isLast
                      ? 'translateX(-85%)'
                      : 'translateX(-50%)';

                    return (
                      <button
                        type="button"
                        key={tick.value}
                        onClick={() => setTotalRows(tick.value)}
                        style={{
                          left: leftPos,
                          transform,
                        }}
                        className={`absolute top-0 flex flex-col items-center transition-colors cursor-pointer group ${
                          isActive
                            ? 'font-bold text-accent'
                            : 'text-ink-3 hover:text-ink'
                        }`}
                        title={`Pilih ${tick.value.toLocaleString('id-ID')} baris`}
                      >
                        <span
                          className={`h-1.5 w-[1.5px] rounded-full transition-colors ${
                            isActive
                              ? 'bg-accent'
                              : 'bg-slate-300 group-hover:bg-accent/60'
                          }`}
                        />
                        <span className="mt-0.5">{tick.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
              <Field label="Kandidat Index 1">
                <Select<IndexTypeId>
                  value={index1}
                  onChange={setIndex1}
                  options={Object.values(INDEX_METHODS).map((m) => ({
                    value: m.id,
                    label: m.name,
                  }))}
                />
              </Field>

              <Field label="Kandidat Index 2">
                <Select<IndexTypeId>
                  value={index2}
                  onChange={setIndex2}
                  options={Object.values(INDEX_METHODS).map((m) => ({
                    value: m.id,
                    label: m.name,
                  }))}
                />
              </Field>
            </div>

            <p className="text-[13px] leading-relaxed text-ink-2 text-justify">
              {scenario.explanationId}
            </p>
          </div>
        </div>
      </Card>

      {/* 3 Plan Cards: Baseline vs Index 1 vs Index 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {plans.map((p, idx) => (
          <Card key={idx} className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-line-soft pb-3">
                <span className="text-[15px] font-semibold text-ink">{p.label}</span>
                {p.data.isSupported ? (
                  <Tag tone={idx === 0 ? 'neutral' : 'ok'} className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {p.data.scanType}
                  </Tag>
                ) : (
                  <Tag tone="bad" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Fallback
                  </Tag>
                )}
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat
                  label="Estimasi Waktu"
                  value={`${p.data.simulatedTimeMs} ms`}
                  tone={idx === 0 ? 'bad' : 'ok'}
                />
                <Stat
                  label="Baris Dipindai"
                  value={p.data.rowsScanned.toLocaleString('id-ID')}
                  tone={idx === 0 ? 'bad' : 'accent'}
                />
                <Stat
                  label="Baris Kembali"
                  value={p.data.rowsReturned.toLocaleString('id-ID')}
                />
                <Stat
                  label="Ukuran Index"
                  value={`${p.data.indexSizeKb.toLocaleString('id-ID')} KB`}
                />
              </div>

              {/* EXPLAIN Output */}
              <div className="mt-4 rounded-2xl bg-fill p-3.5">
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ink-2">
                  <Terminal className="h-3.5 w-3.5 text-accent" />
                  Output EXPLAIN ANALYZE
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-2">
                  {p.data.explainAnalyzeText.join('\n')}
                </pre>
              </div>
            </div>

            <p className="mt-4 border-t border-line-soft pt-3 text-[12px] leading-relaxed text-ink-2 text-justify">
              {p.data.notes}
            </p>
          </Card>
        ))}
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <h3 className="text-[17px] font-semibold tracking-tight text-ink">
                Jumlah Baris yang Dipindai (Rows Scanned)
              </h3>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={P.lineSoft} vertical={false} />
                <XAxis dataKey="name" stroke={P.ink2} fontSize={11} interval={0} tickMargin={8} />
                <YAxis stroke={P.ink2} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: P.surface,
                    borderColor: P.lineSoft,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="Rows Scanned" fill="url(#barBlue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-ok" />
              <h3 className="text-[17px] font-semibold tracking-tight text-ink">
                Estimasi Waktu Eksekusi (ms) vs Ukuran Index (KB)
              </h3>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="barEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={P.lineSoft} vertical={false} />
                <XAxis dataKey="name" stroke={P.ink2} fontSize={11} interval={0} tickMargin={8} />
                <YAxis stroke={P.ink2} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: P.surface,
                    borderColor: P.lineSoft,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="Simulated Time (ms)" fill="url(#barAmber)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Index Size (KB)" fill="url(#barEmerald)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
