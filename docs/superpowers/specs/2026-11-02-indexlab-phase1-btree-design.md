# IndexLab — Interactive Database Indexing Playground (Tahap 1 & 2: App Shell + B-Tree Simulator)

**Date:** 2026-11-02
**Topic:** IndexLab App Shell, Design System, and Interactive PostgreSQL B+Tree & Multicolumn B-Tree Simulator

---

## 1. Overview & Learning Objectives

**IndexLab** adalah aplikasi web edukasi interaktif *local-first* yang dirancang untuk membantu mahasiswa memahami cara kerja metode indexing di PostgreSQL (berdasarkan materi kuliah M10 – Indexing) melalui visualisasi algoritma langkah-demi-langkah (*step-by-step trace*).

Pada iterasi pertama (**Tahap 1 & Tahap 2**), fokus pembangunan mencakup:
1. **Tahap 1 — App Shell, Navigation & Design System:**
   - Kerangka utama dengan 4 menu: **Index Playground**, **Index Comparison**, **Query Performance Lab**, dan **SQL Explorer**.
   - Tema gelap bergaya *modern database developer tool* (terinspirasi dari Tabularis / Supabase Studio).
   - Navigasi ke-7 jenis index utama (**B-tree, Hash, GIN, GiST, BRIN, SP-GiST, Bloom**) di dalam Index Playground, lengkap dengan ringkasan konsep masing-masing, serta fondasi data awal untuk menu Index Comparison, Query Performance Lab, dan SQL Explorer (berdasarkan skema DVD Rental: `film` dan `rental`).
2. **Tahap 2 — B-Tree Simulator (Single-Column & Bonus Multicolumn):**
   - Implementasi struktur **PostgreSQL-style B+Tree** di mana *Internal Nodes* menyimpan *separator keys* & pointer cabang, sedangkan *Leaf Nodes* menyimpan pasangan `(key, ctid/row)` dan terhubung secara horizontal melalui *sibling pointers (`↔`)*.
   - Mendukung operasi interaktif dengan *Step-by-Step Trace Player*:
     - **Equality Search (`=`):** Traversal dari Root ke Leaf.
     - **Comparison & Range Query (`<`, `<=`, `>`, `>=`, `BETWEEN`):** Traversal ke batas awal di Leaf lalu *horizontal scan* antar Leaf Node.
     - **Sorting (`ORDER BY ASC / DESC`):** Pembacaan berurutan sepanjang rantai Leaf Node tanpa operasi `Sort` tambahan.
     - **Insert (`INSERT`) & Delete (`DELETE`):** Menampilkan penyisipan terurut, *Node Split* saat kapasitas penuh (*overflow*), promosi *separator key* ke parent, serta penghapusan key.
   - **Bonus Multicolumn B-Tree Simulator (`(customer_id, staff_id)`):**
     - Memvisualisasikan pengurutan leksikografis (*leading column first, second column tie-breaker*).
     - Mendemonstrasikan perbandingan efisiensi query dengan *leading column* (`WHERE customer_id = 12 AND staff_id = 2` atau `WHERE customer_id = 12`) vs query **tanpa** *leading column* (`WHERE staff_id = 2`) yang terpaksa memindai seluruh leaf.

---

## 2. Technical Stack & Architecture

- **Frontend Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide React icons
- **Animation & Interactive Canvas:** Framer Motion + Custom SVG Tree Layout Engine
- **Charts:** Recharts (untuk pratinjau metrik performa di Query Performance Lab)
- **Testing:** Vitest (unit test untuk algoritma B+Tree & Multicolumn B+Tree)

### Module Boundaries
- `src/types/index.ts`: Definisi tipe untuk metadata ke-7 jenis index, frame simulasi (`TraceStep`), dan skema dataset DVD Rental (`film`, `rental`).
- `src/data/indexCatalog.ts`: Metadata edukasi lengkap untuk 7 jenis index + Multicolumn B-Tree, contoh query SQL `CREATE INDEX` / `EXPLAIN ANALYZE`, dan profil komparasi.
- `src/engines/btreeEngine.ts`: Pure TypeScript engine untuk B+Tree (mendukung `order` 3 atau 4, operasi `insert`, `deleteKey`, `searchEquality`, `searchRange`, `traverseOrder`, serta mode `multicolumn`). Setiap operasi mengembalikan struktur pohon terbaru dan array `BTreeTraceStep[]` berisi status highlight per node/key dan narasi Bahasa Indonesia.
- `src/components/layout/`: `Navbar.tsx`, `FooterDisclaimer.tsx`.
- `src/components/playground/`:
  - `IndexSelectorBar.tsx`: Pemilih 7 jenis index + bonus Multicolumn B-Tree.
  - `BTreeSimulator.tsx`: Kontainer interaktif B-Tree (Single & Multicolumn), kontrol input, preset data DVD Rental (`film_id`, `rental_rate`, `(customer_id, staff_id)`), dan *Step Player*.
  - `BTreeCanvas.tsx`: Komponen SVG + Framer Motion yang menggambar hierarki node, slot key, panah parent-child, panah horizontal antar leaf (`↔`), dan badge `ctid`.
  - `UpcomingIndexPlaceholder.tsx`: Tampilan edukasi ringkas untuk 6 index lainnya yang akan diaktifkan simulator penuhnya pada tahap selanjutnya.
- `src/components/comparison/IndexComparisonView.tsx`: Komparasi side-by-side antar dua jenis index.
- `src/components/perflab/PerformanceLabView.tsx`: Simulasi perbandingan Seq Scan vs Index Scan dengan metrik dan grafik Recharts.
- `src/components/sqlexplorer/SqlExplorerView.tsx`: Referensi interaktif SQL untuk ketujuh index + Multicolumn + `EXPLAIN ANALYZE` dengan fitur *copy-to-clipboard*.

---

## 3. Verification Criteria

1. Unit tests (`vitest run`) memvalidasi bahwa:
   - Penyisipan key secara bertahap pada B+Tree melakukan *node split* dengan benar dan menjaga seluruh data di *leaf nodes* tetap terurut.
   - Pencarian *equality* dan *range query* menghasilkan langkah-langkah (*trace steps*) yang akurat dan mengembalikan seluruh key dalam rentang.
   - Mode *multicolumn* membedakan pencarian dengan *leading column* (traversal pohon langsung) vs tanpa *leading column* (full leaf scan).
2. `npm run build` berjalan sukses tanpa error TypeScript maupun bundling.

