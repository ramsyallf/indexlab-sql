import React, { useState } from 'react';
import {
  HardDrive,
  Eye,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  ArrowDown,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, SectionTitle } from '../ui/primitives';

export const MvIntroSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mv' | 'regular'>('mv');

  return (
    <section className="space-y-6">
      {/* Conceptual Diagram & Interactive Comparison */}
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line-soft">
          <div>
            <SectionTitle>Diagram Konseptual</SectionTitle>
            <p className="mt-1 text-[14px] text-ink-2 text-justify">
              Bandingkan bagaimana PostgreSQL menangani query antara <strong>Materialized View</strong> dan <strong>Regular View</strong>.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-fill p-1 border border-line-soft shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('mv')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${activeTab === 'mv'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
                }`}
            >
              Materialized View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('regular')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${activeTab === 'regular'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
                }`}
            >
              Regular View
            </button>
          </div>
        </div>

        {/* Clean Responsive Flow Pipeline */}
        <div className="mt-6">
          {activeTab === 'mv' ? (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Step 1 */}
                <div className="w-full md:flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold mb-2.5">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h5 className="font-bold text-[15px] text-ink">Tabel Sumber</h5>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed text-justify sm:text-center">
                    Data transaksi operasional mentah di database.
                  </p>
                </div>

                {/* Connector Arrow 1 */}
                <div className="flex flex-col items-center justify-center text-blue-600 shrink-0 px-1 py-1 md:py-0">
                  <span className="text-[11px] font-mono font-semibold mb-1 hidden md:block">Dihitung Sekali</span>
                  <ArrowRight className="h-5 w-5 hidden md:block" />
                  <ArrowDown className="h-5 w-5 md:hidden" />
                </div>

                {/* Step 2 */}
                <div className="w-full md:flex-1 rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 p-4 sm:p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold mb-2.5 shadow-sm shadow-blue-500/25">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <h5 className="font-bold text-[15px] text-blue-950">Materialized View</h5>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed text-justify sm:text-center">
                    Hasil agregasi tersimpan fisik di disk storage.
                  </p>
                </div>

                {/* Connector Arrow 2 */}
                <div className="flex flex-col items-center justify-center text-emerald-600 shrink-0 px-1 py-1 md:py-0">
                  <span className="text-[11px] font-mono font-semibold mb-1 hidden md:block">Query Klien</span>
                  <ArrowRight className="h-5 w-5 hidden md:block" />
                  <ArrowDown className="h-5 w-5 md:hidden" />
                </div>

                {/* Step 3 */}
                <div className="w-full md:flex-1 rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4 sm:p-5 text-center shadow-xs">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold mb-2.5 shadow-sm">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h5 className="font-bold text-[15px] text-emerald-950">Hasil Instan</h5>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed text-justify sm:text-center">
                    Membaca langsung snapshot disk tanpa scan ulang tabel sumber.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3.5 flex items-start gap-3 text-[13px] text-blue-900">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-justify">
                  <strong>Kapan Materialized View Lebih Baik?</strong> Materialized View adalah jalan tengah yang disengaja antara <em>Storage</em> (menggunakan kapasitas disk tambahan) dan <em>Speed</em> (menghilangkan latensi kalkulasi berulang).
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Step 1 */}
                <div className="w-full md:flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold mb-2.5">
                    <Eye className="h-5 w-5" />
                  </div>
                  <h5 className="font-bold text-[15px] text-ink">Akses Klien</h5>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed text-justify sm:text-center">
                    User memanggil view dengan query SELECT biasa.
                  </p>
                </div>

                {/* Connector Arrow 1 */}
                <div className="flex flex-col items-center justify-center text-amber-600 shrink-0 px-1 py-1 md:py-0">
                  <span className="text-[11px] font-mono font-semibold mb-1 hidden md:block">Query Rewrite</span>
                  <ArrowRight className="h-5 w-5 hidden md:block" />
                  <ArrowDown className="h-5 w-5 md:hidden" />
                </div>

                {/* Step 2 */}
                <div className="w-full md:flex-1 rounded-2xl border border-amber-300 bg-amber-50/40 p-4 sm:p-5 text-center shadow-xs">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold mb-2.5">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h5 className="font-bold text-[15px] text-amber-950">Eksekusi Ulang</h5>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed text-justify sm:text-center">
                    PostgreSQL menjalankan query dasar ke tabel sumber setiap saat.
                  </p>
                </div>

                {/* Connector Arrow 2 */}
                <div className="flex flex-col items-center justify-center text-slate-500 shrink-0 px-1 py-1 md:py-0">
                  <span className="text-[11px] font-mono font-semibold mb-1 hidden md:block">Hasil Akhir</span>
                  <ArrowRight className="h-5 w-5 hidden md:block" />
                  <ArrowDown className="h-5 w-5 md:hidden" />
                </div>

                {/* Step 3 */}
                <div className="w-full md:flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 text-center shadow-xs">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold mb-2.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h5 className="font-bold text-[15px] text-ink">Hasil Real-Time</h5>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed text-justify sm:text-center">
                    Data selalu mutakhir, namun memakan beban CPU pada setiap pemanggilan.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 flex items-start gap-3 text-[13px] text-amber-900">
                <HelpCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-justify">
                  <strong>Kapan Regular View Lebih Baik?</strong> Jika tabel sumber sering berubah secara intensif dan Anda mutlak membutuhkan data 100% real-time dengan query dasar yang relatif ringan, gunakan Regular View.
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
};
