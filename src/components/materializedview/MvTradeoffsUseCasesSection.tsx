import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { Card, SectionTitle } from '../ui/primitives';

export const MvTradeoffsUseCasesSection: React.FC = () => {
  return (
    <Card className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-soft">
        <div>
          <SectionTitle>Keunggulan, Batasan & Skenario Penggunaan</SectionTitle>
          <p className="mt-1 text-[14px] text-ink-2 text-justify">
            Pertimbangan teknis saat mengadopsi Materialized View di database sistem.
          </p>
        </div>
      </div>

      {/* Advantages vs Limitations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Keunggulan */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h4 className="font-bold text-[16px]">Keunggulan Utama</h4>
          </div>

          <ul className="space-y-2.5 text-[13.5px] text-emerald-950">
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Latensi Baca Sangat Rendah:</strong> Mengubah query agregasi yang memakan waktu lama menjadi instan dalam hitungan milidetik.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Mengurangi Beban CPU Database:</strong> Server tidak perlu mengulang proses sorting dan join berat setiap kali user memuat data.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Dapat Dibuatkan Index:</strong> Kolom Materialized View dapat diindeks dengan B-Tree untuk filter pencarian cepat.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Stabilitas Performa Sistem:</strong> Melindungi sistem operasional dari beban query analitik besar yang berulang.
              </div>
            </li>
          </ul>
        </div>

        {/* Batasan */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <h4 className="font-bold text-[16px]">Keterbatasan dan Risiko</h4>
          </div>

          <ul className="space-y-2.5 text-[13.5px] text-rose-950">
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Toleransi Data Usang:</strong> Data tidak real-time. Jika aplikasi mewajibkan data mutlak terkini seperti saldo rekening, Materialized View kurang sesuai.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Konsumsi Ruang Disk Tambahan:</strong> Menyimpan salinan data secara fisik sehingga menggunakan ruang penyimpanan tambahan.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Beban Saat Refresh:</strong> Perintah refresh membutuhkan CPU dan I/O untuk mengkalkulasi ulang data.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-2 shrink-0"></span>
              <div className="text-justify">
                <strong>Manajemen Penjadwalan:</strong> Administrator atau engineer perlu mengatur jadwal refresh sesuai kebutuhan pembaruan data.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Practical Use Cases Cards */}
      <div className="space-y-3 pt-2">
        <h4 className="font-bold text-[16px] text-ink">Kasus Penggunaan di Industri</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <BarChart3 className="h-5 w-5" />
              <h5 className="font-bold text-[14.5px] text-ink">Dashboard Eksekutif</h5>
            </div>
            <p className="text-[12.5px] text-ink-2 leading-relaxed text-justify">
              Menampilkan KPI omzet bulanan, jumlah pengguna aktif, dan rasio konversi yang diakses berkali-kali tanpa membebani server utama.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Calendar className="h-5 w-5" />
              <h5 className="font-bold text-[14.5px] text-ink">Laporan Rekap Harian</h5>
            </div>
            <p className="text-[12.5px] text-ink-2 leading-relaxed text-justify">
              Toko retail atau e-commerce merekap total transaksi per cabang setiap tengah malam dengan jadwal refresh otomatis.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <h5 className="font-bold text-[14.5px] text-ink">Agregasi Log Sensor</h5>
            </div>
            <p className="text-[12.5px] text-ink-2 leading-relaxed text-justify">
              Data IoT menghasilkan banyak baris per jam. Materialized View menyimpan rangkuman rata-rata suhu per interval tertentu.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Layers className="h-5 w-5" />
              <h5 className="font-bold text-[14.5px] text-ink">Sistem Akademik Kampus</h5>
            </div>
            <p className="text-[12.5px] text-ink-2 leading-relaxed text-justify">
              Menyimpan IPK kumulatif dan total SKS mahasiswa yang dihitung ulang setiap kali periode pengisian nilai semester berakhir.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
