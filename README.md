# IndexLab – Interactive Database Indexing Playground

> Educational interactive web application designed to teach university students and developers how PostgreSQL indexing methods work under the hood through visual simulations, step-by-step algorithms, query performance comparisons (EXPLAIN ANALYZE), and SQL syntax exploration.

---

## 🌟 Fitur Utama

1. **Index Playground (8 Metode Indexing PostgreSQL)**
   * **B-Tree**: Lehman & Yao B+Tree dengan pencarian equality, range, INSERT/DELETE, ORDER BY ASC/DESC, dan leaf chaining.
   * **Multicolumn B-Tree**: Composite key `(customer_id, staff_id)` dengan evaluasi aturan prioritas leksikografis (*Leading Column Rule*).
   * **Hash Index**: Diagram visual 8-bucket directory, hashing `hashtext()`, dan resolusi tabrakan (*collision overflow chaining*).
   * **GIN (Generalized Inverted Index)**: Arsitektur Lexicon / Inverted terms, posting list pointers, dan simulasi Bitmap Index Scan (`@>` AND vs `&&` OR).
   * **GiST (Generalized Search Tree)**: Peta spasial 2D R-Tree MBR (*Minimum Bounding Box*) dengan pemangkasan kotak non-overlap.
   * **BRIN (Block Range Index)**: Pemetaan ringkasan `[Min..Max]` per blok fisik 8KB dan visualisasi *Block Elimination Barrier* (blok dieliminasi dari pemindaian heap scan).
   * **SP-GiST (Space-Partitioned GiST)**: Partisi ruang 2D kuadran QuadTree (NW, NE, SW, SE) yang saling lepas (*disjoint*).
   * **Bloom Filter**: Hashing multi-kolom fleksibel ke 16-bit signature mask, demonstrasi *Definite Exclusion* dan *False Positive*.

2. **Index Comparison**
   * Perbandingan langsung *side-by-side* antara dua jenis index.
   * Analisis kebutuhan ruang penyimpanan (*disk size score*), overhead operasi penulisan (*write overhead*), kelebihan, dan keterbatasan.
   * Matriks kompatibilitas pola query dan operator.

3. **Query Performance Lab**
   * Simulasi interaktif perbandingan *Sequential Scan* vs *Index Scan* vs *Alternative Index*.
   * Metrik baris dipindai (*rows scanned*), blok disk dibaca (*blocks read*), waktu eksekusi simulasi, dan estimasi ukuran index.
   * Visualisasi grafik perbandingan dengan Recharts dan simulasi output `EXPLAIN ANALYZE`.

4. **SQL Explorer**
   * Katalog perintah DDL `CREATE INDEX`, `DROP INDEX`, `CREATE EXTENSION`, dan query pengujian `EXPLAIN ANALYZE` yang siap disalin (*one-click copy*).

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript
* **Routing**: React Router DOM (HashRouter)
* **Styling**: Tailwind CSS (Modern Web3 & High-Tech SaaS Aesthetics)
* **Animasi**: Framer Motion
* **Visualisasi & Grafik**: Custom SVG Data Structure Canvases, Recharts
* **Build Tool & Test**: Vite, Vitest

---

## 🚀 Menjalankan Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/ramsyallf/indexlab-sql.git
   cd indexlab-sql
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka browser pada `http://localhost:5173`.

4. **Jalankan unit tests:**
   ```bash
   npm run test
   ```

5. **Build production:**
   ```bash
   npm run build
   ```

---

## 📜 Lisensi & Catatan Edukasi
Seluruh metrik performa dan waktu eksekusi adalah simulasi edukatif konseptual berbasis karakteristik algoritmik internal PostgreSQL, ditujukan untuk mempermudah pemahaman mahasiswa basis data.
