import React, { useState } from 'react';
import {
  Layers,
  HardDrive,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Card, SectionTitle } from '../ui/primitives';

interface ComparisonRow {
  aspect: string;
  viewVal: string;
  mvVal: string;
  indexVal: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    aspect: 'Tujuan Utama',
    viewVal: 'Menyederhanakan query dan enkapsulasi logika bisnis',
    mvVal: 'Menyimpan hasil query komputasi kompleks secara fisik',
    indexVal: 'Mempercepat pencarian dan pemfilteran baris data',
  },
  {
    aspect: 'Menyimpan Hasil Query Secara Fisik?',
    viewVal: 'Tidak, dieksekusi ulang setiap kali diakses',
    mvVal: 'Ya, disimpan sebagai snapshot tabel di disk',
    indexVal: 'Tidak, menyimpan struktur penunjuk baris',
  },
  {
    aspect: 'Menyimpan Struktur Data Tambahan?',
    viewVal: 'Tidak, hanya definisi teks query di katalog',
    mvVal: 'Ya, menyimpan baris data hasil komputasi',
    indexVal: 'Ya, menyimpan struktur pohon pencarian',
  },
  {
    aspect: 'Otomatis Mengikuti Perubahan Sumber?',
    viewVal: 'Ya, selalu mutakhir karena dihitung real-time',
    mvVal: 'Tidak, membutuhkan operasi refresh',
    indexVal: 'Ya, database otomatis memperbarui index saat data berubah',
  },
  {
    aspect: 'Konsumsi Ruang Disk',
    viewVal: 'Minimal, hanya metadata definisi query',
    mvVal: 'Ya, sebesar ukuran baris snapshot yang disimpan',
    indexVal: 'Ya, sebesar ukuran struktur pohon index',
  },
  {
    aspect: 'Manfaat Utama',
    viewVal: 'Reusabilitas kode query dan kontrol keamanan data',
    mvVal: 'Baca sangat cepat untuk query agregasi berulang',
    indexVal: 'Pencarian cepat tanpa sequential scan seluruh tabel',
  },
];

export const MvComparisonSection: React.FC = () => {
  const [selectedAspect, setSelectedAspect] = useState<number | null>(null);

  return (
    <Card className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-soft">
        <div>
          <SectionTitle>Perbandingan: View vs Materialized View vs Index</SectionTitle>
            <p className="mt-1 text-[14px] text-ink-2 text-justify">
              Pahami perbedaan mendasar ketiga fitur database ini agar tepat memilih solusi optimal pada arsitektur sistem.
            </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-[13.5px] border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-ink border-b border-slate-200">
              <th className="py-3 px-4 font-bold w-1/4">Aspek Perbandingan</th>
              <th className="py-3 px-4 font-bold text-slate-800 w-1/4">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-slate-600" />
                  <span>Regular View</span>
                </div>
              </th>
              <th className="py-3 px-4 font-bold text-blue-900 bg-blue-50/70 border-x border-blue-200/80 w-1/4">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-blue-600" />
                  <span>Materialized View</span>
                </div>
              </th>
              <th className="py-3 px-4 font-bold text-indigo-900 w-1/4">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span>Index</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COMPARISON_DATA.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedAspect(selectedAspect === idx ? null : idx)}
                className={`transition-colors cursor-pointer ${selectedAspect === idx ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                  }`}
              >
                <td className="py-3 px-4 font-semibold text-ink">{row.aspect}</td>
                <td className="py-3 px-4 text-ink-2 leading-relaxed">{row.viewVal}</td>
                <td className="py-3 px-4 font-medium text-blue-950 bg-blue-50/40 border-x border-blue-100 leading-relaxed">
                  {row.mvVal}
                </td>
                <td className="py-3 px-4 text-ink-2 leading-relaxed">{row.indexVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Synthesis Insight: Synergy between MV and Index */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h4 className="font-bold text-[15px] text-ink">
            Materialized View dan Index Saling Melengkapi
          </h4>
        </div>
        <p className="text-[13.5px] leading-relaxed text-ink-2 text-justify">
          Materialized View dan Index <strong>bukanlah pilihan yang saling meniadakan</strong>, melainkan dapat dikombinasikan:
        </p>
          <ul className="list-disc pl-5 text-[13px] text-ink-2 space-y-1 text-justify">
            <li>
              <strong>Materialized View</strong> bertugas menyelesaikan masalah <em>komputasi agregasi berat</em> seperti <code className="text-xs bg-white px-1 py-0.5 rounded border border-slate-200">SUM</code> pada banyak baris transaksi.
            </li>
            <li>
              <strong>Index</strong> bertugas mempercepat <em>pencarian baris</em> pada hasil agregasi tersebut ketika memfilter dengan klausa <code className="text-xs bg-white px-1 py-0.5 rounded border border-slate-200">WHERE</code>.
            </li>
            <li>
              Anda dapat membuat index langsung di atas Materialized View dengan perintah <code className="font-mono text-xs text-blue-600 bg-white px-1 py-0.5 rounded border border-blue-200">CREATE INDEX ON sales_summary(total_sales);</code>.
            </li>
          </ul>
      </div>
    </Card>
  );
};
