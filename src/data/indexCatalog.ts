import { IndexMethodSpec, IndexTypeId, PerfScenario, SqlExampleItem } from '../types';

export const INDEX_METHODS: Record<IndexTypeId, IndexMethodSpec> = {
  btree: {
    id: 'btree',
    name: 'B-Tree Index (Default PostgreSQL)',
    shortName: 'B-Tree',
    badge: 'Equality · Range · Sort',
    tagline: 'Balanced Search Tree (nbtree) untuk pencarian ekuivalensi, rentang nilai, dan pengurutan.',
    summary:
      'Metode indexing default di PostgreSQL. Menyimpan key secara terurut di dalam pohon berimbang (B+Tree) di mana Leaf Nodes saling terhubung dua arah (doubly-linked list) untuk memfasilitasi Range Scan dan ORDER BY tanpa pengurutan ulang.',
    dataStructureName: 'B+Tree (Lehman & Yao High-Concurrency Variant)',
    howItWorks:
      'Root dan Internal Node menyimpan separator key sebagai penunjuk arah cabang. Seluruh pasangan (key, ctid pointer baris) tersimpan secara terurut di Leaf Nodes yang saling terhubung secara horizontal.',
    searchMechanism:
      'Dimulai dari Root Node, melakukan binary search di dalam slot node untuk memilih cabang anak, turun secara logaritmik O(log N) hingga Leaf Node. Untuk Range Query, cukup menelusuri pointer horizontal antar Leaf Node.',
    supportedOperators: ['=', '<', '<=', '>', '>=', 'BETWEEN', 'IN', 'IS NULL', "LIKE 'prefix%'"],
    suitableQueries: [
      'Pencarian nilai spesifik (WHERE film_id = 45)',
      'Pencarian rentang nilai atau tanggal (WHERE rental_rate BETWEEN 2.99 AND 4.99)',
      'Pengurutan hasil query (ORDER BY rental_date ASC/DESC)',
      'Pencarian awalan teks (WHERE title LIKE \'ACADEMY%\')',
    ],
    notSuitableFor: [
      'Pencarian substring di tengah teks (LIKE \'%DINOSAUR%\') tanpa pg_trgm',
      'Data array/JSONB dengan banyak elemen per baris (lebih cocok GIN)',
      'Data geometri/spasial 2D atau overlap poligon (lebih cocok GiST/SP-GiST)',
    ],
    advantages: [
      'Serbaguna: menangani equality, comparison, range scan, dan sorting sekaligus',
      'Waktu pencarian konsisten O(log N) karena pohon selalu seimbang otomatis (self-balancing)',
      'Mendukung Index-Only Scan jika kolom yang dibutuhkan tersedia di leaf',
    ],
    limitations: [
      'Ukuran index relatif cukup besar (menyimpan setiap nilai key + pointer tuple)',
      'Memiliki overhead penulisan (INSERT/UPDATE) ketika terjadi Node Split pada halaman penuh',
    ],
    storageProfile: {
      relativeSize: 'Sedang',
      sizeScore: 60,
      buildCostScore: 55,
      writeOverheadScore: 55,
      description: 'Menyimpan salinan key terurut beserta pointer tuple (ctid) di setiap leaf page 8KB.',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: true,
      sortingOrder: true,
      prefixLike: true,
      fullTextArrayJsonb: false,
      spatialGeometric: false,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_film_rental_rate\nON film (rental_rate);`,
  },

  btree_multicolumn: {
    id: 'btree_multicolumn',
    name: 'Multicolumn B-Tree Index',
    shortName: 'Multicolumn B-Tree',
    badge: 'Composite Key · Multi-Kolom',
    isBonus: false,
    tagline: 'B-Tree pada lebih dari satu kolom dengan urutan prioritas leksikografis (Leading Column Rule).',
    summary:
      'Mengindeks kombinasi beberapa kolom sekaligus, misalnya (customer_id, staff_id). Entri diurutkan berdasarkan kolom pertama (leading column) terlebih dahulu; kolom kedua hanya menjadi penentu urutan jika kolom pertama bernilai sama.',
    dataStructureName: 'Composite Key B+Tree (Tuple-Ordered)',
    howItWorks:
      'Setiap key di dalam node berupa pasangan komposit (k1, k2). Perbandingan dilakukan secara leksikografis: bandingkan k1 dulu; apabila k1 sama, baru bandingkan k2.',
    searchMechanism:
      'Sangat efisien bila klausa WHERE menyertakan kolom pertama (leading column). Jika query hanya memfilter kolom kedua tanpa kolom pertama, pohon tidak bisa memangkas cabang dari Root sehingga harus memindai banyak leaf atau jatuh ke Seq Scan.',
    supportedOperators: ['= (pada leading col)', 'AND kombinasi kolom', 'Range pada kolom terakhir yang difilter'],
    suitableQueries: [
      'WHERE customer_id = 12 AND staff_id = 2 (Full Composite Match)',
      'WHERE customer_id = 12 (Leading Prefix Match)',
      'WHERE customer_id = 12 AND staff_id > 1 (Equality di col 1 + Range di col 2)',
    ],
    notSuitableFor: [
      'Query yang hanya memfilter kolom kedua/ketiga saja (WHERE staff_id = 2)',
      'Kombinasi filter dengan banyak kolom opsional yang sering berubah-ubah (pertimbangkan Bloom atau index terpisah)',
    ],
    advantages: [
      'Sangat cepat untuk query yang selalu menyertakan kombinasi kolom yang sama',
      'Dapat memenuhi kebutuhan ORDER BY (col1, col2) secara langsung',
    ],
    limitations: [
      'Terikat aturan Leading Column (urutan pendefinisian kolom sangat menentukan)',
      'Ukuran index lebih besar dibandingkan single-column B-Tree',
    ],
    storageProfile: {
      relativeSize: 'Besar',
      sizeScore: 72,
      buildCostScore: 65,
      writeOverheadScore: 65,
      description: 'Menyimpan gabungan beberapa kolom di setiap entri index.',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: true,
      sortingOrder: true,
      prefixLike: true,
      fullTextArrayJsonb: false,
      spatialGeometric: false,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_rental_customer_staff\nON rental (customer_id, staff_id);`,
  },

  hash: {
    id: 'hash',
    name: 'Hash Index',
    shortName: 'Hash',
    badge: 'Equality Only (=)',
    tagline: 'Pencarian ekuivalensi cepat berbasis fungsi hash 32-bit dan bucket.',
    summary:
      'Mengonversi nilai kolom menjadi kode hash 32-bit menggunakan fungsi hash deterministik, lalu memetakannya ke dalam bucket. Hanya menyimpan nilai hash (bukan nilai asli yang panjang), namun HANYA mendukung operator sama dengan (=).',
    dataStructureName: 'Hash Bucket Array + Overflow Chains',
    howItWorks:
      'Nilai input dimasukkan ke fungsi hash h(k) mod M untuk menentukan nomor Bucket. Jika dua nilai berbeda menghasilkan bucket yang sama (Collision), entri ditambahkan ke rantai bucket/overflow page.',
    searchMechanism:
      'Menghitung hash dari nilai yang dicari O(1), langsung melompat ke Bucket tujuan, membandingkan hash code, lalu melakukan verifikasi nilai asli pada tuple tabel (recheck) untuk mengatasi potensi hash collision.',
    supportedOperators: ['='],
    suitableQueries: [
      'Pencarian exact match pada string panjang/UUID/URL (WHERE rating = \'NC-17\')',
      'Lookup kode unik atau kunci referensi dengan operator =',
    ],
    notSuitableFor: [
      'Range query (WHERE rental_rate > 2.99 atau BETWEEN)',
      'Pengurutan data (ORDER BY)',
      'Pencarian sebagian teks (LIKE)',
    ],
    advantages: [
      'Waktu akses rata-rata O(1) konstan untuk pencarian equality (=)',
      'Ukuran index bisa lebih kecil dari B-Tree jika kolom aslinya berupa teks/bytea berukuran sangat panjang karena yang disimpan hanya 4-byte hash code',
    ],
    limitations: [
      'Sama sekali tidak mendukung operator perbandingan (<, >), BETWEEN, maupun ORDER BY',
      'Tidak mendukung multicolumn index maupun unique constraint di PostgreSQL',
    ],
    storageProfile: {
      relativeSize: 'Kecil',
      sizeScore: 45,
      buildCostScore: 45,
      writeOverheadScore: 50,
      description: 'Hanya menyimpan nilai hash 32-bit beserta pointer tuple ctid di dalam bucket.',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: false,
      sortingOrder: false,
      prefixLike: false,
      fullTextArrayJsonb: false,
      spatialGeometric: false,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_film_rating_hash\nON film USING HASH (rating);`,
  },

  gin: {
    id: 'gin',
    name: 'GIN (Generalized Inverted Index)',
    shortName: 'GIN',
    badge: 'Array · JSONB · Full-Text',
    tagline: 'Inverted Index untuk nilai majemuk (multi-value): Array, JSONB, dan Full-Text Search.',
    summary:
      'Dirancang untuk kolom yang berisi banyak elemen di dalam satu baris (seperti kata-kata dalam dokumen, elemen Array, atau key-value JSONB). Memetakan setiap elemen/token unik ke daftar baris (Posting List) tempat elemen tersebut muncul.',
    dataStructureName: 'B-Tree of Keys/Tokens → Posting List (ctid Array / Posting Tree)',
    howItWorks:
      'Setiap baris dipecah (tokenized) menjadi elemen-elemen penyusunnya. Setiap elemen unik disimpan satu kali di dalam kamus (entry tree) dan menunjuk ke daftar terurut ID baris (Posting List) yang memuat elemen tersebut.',
    searchMechanism:
      'Mencari token yang diminta di dalam kamus index, mengambil Posting List masing-masing token, lalu melakukan operasi himpunan (Intersection AND untuk @> atau Union OR untuk &&) pada daftar ID baris.',
    supportedOperators: ['@>', '<@', '&&', '?', '?|', '?&', '@@ (tsquery)'],
    suitableQueries: [
      'Pencarian elemen di dalam kolom Array (WHERE special_features @> ARRAY[\'Trailers\'])',
      'Pencarian struktur JSONB (WHERE metadata @> \'{"language": "Japanese"}\')',
      'Full-Text Search dokumen (WHERE fulltext @@ to_tsquery(\'dinosaur & drama\'))',
    ],
    notSuitableFor: [
      'Kolom skalar sederhana (angka tunggal/tanggal) yang cukup ditangani B-Tree',
      'Tabel dengan frekuensi UPDATE/INSERT ekstrem tanpa tuning fastupdate',
    ],
    advantages: [
      'Sangat cepat untuk menemukan baris yang mengandung elemen tertentu di dalam Array, JSONB, atau dokumen teks panjang',
      'Mampu menggabungkan beberapa syarat token melalui operasi bitmap/posting list intersection',
    ],
    limitations: [
      'Biaya pembuatan index dan overhead penulisan (INSERT/UPDATE) tinggi karena satu baris baru dapat memodifikasi puluhan posting list sekaligus',
      'Ukuran index dapat menjadi cukup besar pada dokumen dengan kosakata sangat beragam',
    ],
    storageProfile: {
      relativeSize: 'Besar',
      sizeScore: 80,
      buildCostScore: 85,
      writeOverheadScore: 85,
      description: 'Menyimpan pohon kamus token beserta daftar posting list ctid untuk setiap token.',
    },
    operatorSupportMatrix: {
      equality: false,
      comparisonRange: false,
      sortingOrder: false,
      prefixLike: false,
      fullTextArrayJsonb: true,
      spatialGeometric: false,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_film_special_features_gin\nON film USING GIN (special_features);`,
  },

  gist: {
    id: 'gist',
    name: 'GiST (Generalized Search Tree)',
    shortName: 'GiST',
    badge: 'Geometric · Spatial · Range',
    tagline: 'Struktur pohon berbasis Bounding Region (R-Tree) untuk data spasial, geometri, dan rentang.',
    summary:
      'Framework pohon berimbang yang membagi data ke dalam wilayah pembatas (Minimum Bounding Rectangle / MBR) yang boleh saling tumpang-tindih (overlapping). Sangat ideal untuk data koordinat 2D, poligon PostGIS, dan tipe range.',
    dataStructureName: 'Balanced Bounding-Box Hierarchy (R-Tree over GiST)',
    howItWorks:
      'Setiap node internal menyimpan kotak pembatas (Bounding Box) yang membungkus seluruh objek geometri pada cabangnya. Berbeda dengan SP-GiST, kotak pembatas antar cabang pada GiST dapat saling tumpang-tindih.',
    searchMechanism:
      'Memeriksa apakah wilayah query berpotongan (intersects/overlaps) dengan Bounding Box suatu node. Jika tidak berpotongan, seluruh cabang dieliminasi; jika berpotongan, telusuri cabang tersebut (bisa lebih dari satu cabang jika MBR tumpang-tindih).',
    supportedOperators: ['&& (overlap)', '@> (contains)', '<@ (contained by)', '<-> (Nearest Neighbor KNN)', '<<', '>>'],
    suitableQueries: [
      'Pencarian lokasi dalam area kotak/poligon (WHERE location && box \'((2,2),(6,6))\')',
      'Pencarian K-Nearest Neighbor / lokasi terdekat (ORDER BY location <-> point \'(4,5)\' LIMIT 5)',
      'Deteksi tumpang-tindih jadwal/periode waktu (tsrange && tsrange)',
    ],
    notSuitableFor: [
      'Pencarian ekuivalensi angka/teks biasa (B-Tree jauh lebih efisien)',
    ],
    advantages: [
      'Mendukung query multidimensi, geometri, poligon, dan Nearest-Neighbor (<->) secara native',
      'Fleksibel untuk berbagai tipe data kompleks yang memiliki konsep containment atau overlap',
    ],
    limitations: [
      'Karena Bounding Box antar cabang boleh tumpang-tindih (overlap), satu pencarian kadang harus menelusuri beberapa cabang sekaligus',
      'Waktu pencarian dan ukuran index lebih besar dibandingkan B-Tree untuk data 1 dimensi',
    ],
    storageProfile: {
      relativeSize: 'Besar',
      sizeScore: 75,
      buildCostScore: 70,
      writeOverheadScore: 70,
      description: 'Menyimpan predikat bounding box pada setiap level internal dan leaf.',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: false,
      sortingOrder: false,
      prefixLike: false,
      fullTextArrayJsonb: true,
      spatialGeometric: true,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_store_location_gist\nON store_locations USING GIST (coordinates);`,
  },

  brin: {
    id: 'brin',
    name: 'BRIN (Block Range Index)',
    shortName: 'BRIN',
    badge: 'Big Data · Correlated Blocks',
    tagline: 'Index super ringkas yang menyimpan ringkasan Min-Max per rentang blok fisik untuk tabel berukuran masif.',
    summary:
      'Alih-alih mengindeks setiap baris satu per satu, BRIN membagi tabel menjadi rentang blok disk fisik (pages_per_range) dan hanya menyimpan nilai Minimum serta Maksimum pada setiap blok. Sangat hemat ruang untuk data time-series/log yang terurut secara fisik.',
    dataStructureName: 'Block Range Summary Array (BlockNumber → [Min, Max])',
    howItWorks:
      'Untuk setiap rentang halaman fisik di disk (misalnya Blok 0, Blok 1, dst.), BRIN mencatat nilai terkecil (min) dan terbesar (max) yang ada di dalam blok tersebut.',
    searchMechanism:
      'Membandingkan kondisi query dengan pasangan [Min, Max] tiap blok. Blok yang rentang [Min, Max]-nya tidak mungkin memuat nilai dicari langsung dilewati (Block Elimination). Blok yang cocok kemudian dipindai baris-per-barisnya.',
    supportedOperators: ['=', '<', '<=', '>', '>=', 'BETWEEN'],
    suitableQueries: [
      'Tabel log/transaksi berukuran puluhan juta baris di mana kolom waktu (rental_date) selalu bertambah seiring urutan insert',
      'Data sensor IoT atau histori pembayaran berurutan waktu',
    ],
    notSuitableFor: [
      'Tabel yang datanya tersebar acak secara fisik (korelasi fisik rendah menyebabkan setiap blok memiliki min-max yang lebar sehingga tidak ada blok yang bisa dieliminasi)',
      'Pencarian titik tunggal pada tabel kecil yang membutuhkan presisi tinggi (gunakan B-Tree)',
    ],
    advantages: [
      'Ukuran index luar biasa kecil (seringkali 100x–1000x lebih kecil daripada B-Tree)',
      'Overhead INSERT dan pemeliharaan sangat ringan',
    ],
    limitations: [
      'Bersifat lossy: harus tetap membaca seluruh baris di dalam blok yang lolos seleksi',
      'Sangat bergantung pada korelasi urutan fisik data di disk (Physical Correlation)',
    ],
    storageProfile: {
      relativeSize: 'Sangat Kecil',
      sizeScore: 8,
      buildCostScore: 15,
      writeOverheadScore: 10,
      description: 'Hanya beberapa byte (min & max) untuk setiap ratusan halaman tabel (default 128 pages = 1MB data).',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: true,
      sortingOrder: false,
      prefixLike: false,
      fullTextArrayJsonb: false,
      spatialGeometric: true,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_rental_date_brin\nON rental USING BRIN (rental_date)\nWITH (pages_per_range = 64);`,
  },

  spgist: {
    id: 'spgist',
    name: 'SP-GiST (Space-Partitioned GiST)',
    shortName: 'SP-GiST',
    badge: 'Space Partitioning · Quadtree / Trie',
    tagline: 'Pohon partisi ruang non-overlapping (Quadtree, k-d tree, Radix Trie) untuk data dengan klaster tidak merata.',
    summary:
      'Membagi ruang pencarian menjadi partisi-partisi yang TIDAK saling tumpang-tindih (non-overlapping), seperti Quadtree (4 kuadran NW, NE, SW, SE) atau Prefix Trie. Sangat efektif ketika data menumpuk di area tertentu (skewed data).',
    dataStructureName: 'Non-Overlapping Space Partition Tree (Quadtree / Radix Tree)',
    howItWorks:
      'Ruang 2D (atau ruang prefix teks/IP) dibagi secara rekursif menjadi kuadran/partisi yang saling lepas (disjoint) setiap kali jumlah titik di dalam suatu kuadran melampaui kapasitas maksimum.',
    searchMechanism:
      'Karena partisi tidak pernah tumpang-tindih, pencarian satu titik (point lookup) hanya perlu mengikuti tepat SATU jalur kuadran dari Root ke Leaf. Pencarian kotak (box query) hanya memeriksa kuadran yang berpotongan dengan area pencarian.',
    supportedOperators: ['=', '&&', '<@', '@>', '^@ (starts with)', '<<', '>>'],
    suitableQueries: [
      'Data koordinat titik (point) dengan kepadatan tidak merata (misal peta lokasi pelanggan di pusat kota vs pedesaan)',
      'Data berstruktur hierarki prefix seperti alamat IP (inet), nomor telepon, atau URL',
    ],
    notSuitableFor: [
      'Objek poligon besar yang melintasi banyak batas kuadran sekaligus (lebih cocok GiST R-Tree)',
    ],
    advantages: [
      'Partisi tidak pernah tumpang-tindih (non-overlapping), sehingga pencarian titik tidak pernah bercabang ganda',
      'Kedalaman pohon dapat menyesuaikan kepadatan lokal data (adaptive depth)',
    ],
    limitations: [
      'Pohon bisa menjadi tidak seimbang (unbalanced) pada area yang sangat padat titik',
      'Kurang cocok untuk objek berdimensi luas yang memotong garis batas partisi',
    ],
    storageProfile: {
      relativeSize: 'Sedang',
      sizeScore: 55,
      buildCostScore: 60,
      writeOverheadScore: 55,
      description: 'Menyimpan titik pusat partisi (centroid/prefix) dan pointer ke sub-kuadran.',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: false,
      sortingOrder: false,
      prefixLike: true,
      fullTextArrayJsonb: false,
      spatialGeometric: true,
      multiColumnArbitrary: false,
    },
    defaultSqlExample: `CREATE INDEX idx_customer_coords_spgist\nON customer_map USING SPGIST (location_point);`,
  },

  bloom: {
    id: 'bloom',
    name: 'Bloom Filter Index',
    shortName: 'Bloom',
    badge: 'Probabilistic · Multi-Column',
    requiresExtension: 'CREATE EXTENSION IF NOT EXISTS bloom;',
    tagline: 'Filter probabilistik berbasis Bit Array untuk query multi-kolom dengan kombinasi filter bebas.',
    summary:
      'Menggunakan struktur Bloom Filter (signature bit array per baris) untuk mengindeks banyak kolom sekaligus. Mengatasi kelemahan Multicolumn B-Tree karena mahasiswa/aplikasi dapat memfilter kombinasi kolom mana saja tanpa terikat urutan kolom pertama.',
    dataStructureName: 'Per-Tuple Bit Signature Array + K Hash Functions',
    howItWorks:
      'Setiap nilai kolom pada sebuah baris di-hash oleh beberapa fungsi hash (h1, h2, ...) untuk menyalakan bit (menjadi 1) pada posisi tertentu di dalam signature bit sepanjang M bit.',
    searchMechanism:
      'Menghitung posisi bit dari kolom-kolom yang dicari di klausa WHERE. Jika ada SATU saja bit yang bernilai 0 pada signature baris, baris tersebut PASTI TIDAK COCOK (Definite No). Jika semua bit bernilai 1, baris tersebut MUNGKIN COCOK (Probable Match) dan PostgreSQL akan melakukan Heap Recheck untuk menyaring False Positive.',
    supportedOperators: ['= (pada kombinasi subset kolom mana pun)'],
    suitableQueries: [
      'Tabel lebar dengan banyak kolom atribut (customer_id, staff_id, store_id, status) di mana user sering mencari kombinasi kolom secara acak',
      'Menggantikan pembuatan 5–10 index B-Tree terpisah untuk kombinasi filter ekuivalensi (=)',
    ],
    notSuitableFor: [
      'Range query (<, >, BETWEEN) atau pengurutan (ORDER BY)',
      'Pencarian kolom tunggal biasa (B-Tree atau Hash jauh lebih cepat)',
    ],
    advantages: [
      'Bebas urutan kolom: tetap bekerja meskipun kolom pertama tidak disertakan dalam WHERE',
      'Satu index Bloom berukuran ringkas dapat menggantikan banyak index komposit',
    ],
    limitations: [
      'Bersifat probabilistik: menghasilkan False Positive sehingga memerlukan pembacaan ulang baris tabel (Heap Recheck)',
      'Hanya mendukung operator equality (=) dan memerlukan ekstensi tambahan (`bloom`)',
    ],
    storageProfile: {
      relativeSize: 'Kecil',
      sizeScore: 30,
      buildCostScore: 40,
      writeOverheadScore: 35,
      description: 'Menyimpan signature bit ringkas (default 80 bit / 10 byte per baris) beserta ctid.',
    },
    operatorSupportMatrix: {
      equality: true,
      comparisonRange: false,
      sortingOrder: false,
      prefixLike: false,
      fullTextArrayJsonb: false,
      spatialGeometric: false,
      multiColumnArbitrary: true,
    },
    defaultSqlExample: `CREATE EXTENSION IF NOT EXISTS bloom;\n\nCREATE INDEX idx_rental_bloom\nON rental USING BLOOM (customer_id, staff_id)\nWITH (length = 80, col1 = 2, col2 = 2);`,
  },
};

export const INDEX_ORDER: IndexTypeId[] = [
  'btree',
  'btree_multicolumn',
  'hash',
  'gin',
  'gist',
  'brin',
  'spgist',
  'bloom',
];

export const SQL_EXPLORER_EXAMPLES: SqlExampleItem[] = [
  {
    id: 'sql-btree-create',
    indexType: 'btree',
    title: 'B-Tree Index pada film(rental_rate)',
    category: 'CREATE INDEX',
    tableContext: 'film (1.000 baris contoh / skala produksi)',
    description:
      'Membuat index B-Tree standar pada kolom numerik rental_rate. Mendukung pencarian =, <, >, BETWEEN, dan ORDER BY.',
    sql: `-- Membuat B-Tree Index (USING BTREE bersifat opsional karena default)\nCREATE INDEX idx_film_rental_rate\nON film (rental_rate);\n\n-- Menguji dengan EXPLAIN ANALYZE untuk Range Query\nEXPLAIN ANALYZE\nSELECT film_id, title, rental_rate\nFROM film\nWHERE rental_rate BETWEEN 0.99 AND 2.99\nORDER BY rental_rate ASC;`,
    expectedPlanNote:
      'PostgreSQL memilih Index Scan atau Bitmap Index Scan pada idx_film_rental_rate, serta menghindari langkah Sort tambahan bila menggunakan Index Scan.',
  },
  {
    id: 'sql-btree-multi',
    indexType: 'btree_multicolumn',
    title: 'Multicolumn B-Tree pada rental(customer_id, staff_id)',
    category: 'CREATE INDEX',
    tableContext: 'rental (16.044 baris pada DVD Rental)',
    description:
      'Membuat Multicolumn B-Tree Index sesuai bonus materi PPT. Perhatikan perbedaan rencana eksekusi saat leading column (customer_id) disertakan vs dihilangkan.',
    sql: `-- Membuat Multicolumn B-Tree Index\nCREATE INDEX idx_rental_customer_staff\nON rental (customer_id, staff_id);\n\n-- 1. SANGAT EFISIEN: Menyertakan leading column (customer_id)\nEXPLAIN ANALYZE\nSELECT rental_id, rental_date\nFROM rental\nWHERE customer_id = 12 AND staff_id = 2;\n\n-- 2. TIDAK OPTIMAL: Hanya mencari kolom kedua (staff_id) tanpa leading column\nEXPLAIN ANALYZE\nSELECT rental_id, rental_date\nFROM rental\nWHERE staff_id = 2;`,
    expectedPlanNote:
      'Query #1 menggunakan Index Scan langsung ke cabang customer_id=12. Query #2 biasanya jatuh ke Seq Scan karena leading column tidak disebutkan.',
  },
  {
    id: 'sql-hash-create',
    indexType: 'hash',
    title: 'Hash Index pada film(rating)',
    category: 'CREATE INDEX',
    tableContext: 'film (kolom kategori / kode eksak)',
    description:
      'Membuat Hash Index untuk pencarian ekuivalensi (=). Ingat bahwa Hash Index tidak dapat digunakan untuk operator <, >, atau ORDER BY.',
    sql: `-- Membuat Hash Index\nCREATE INDEX idx_film_rating_hash\nON film USING HASH (rating);\n\n-- Query Equality yang didukung Hash Index\nEXPLAIN ANALYZE\nSELECT film_id, title, rating\nFROM film\nWHERE rating = 'NC-17';`,
    expectedPlanNote:
      'Menghasilkan Index Scan atau Bitmap Index Scan menggunakan idx_film_rating_hash dengan perbandingan kode hash 32-bit.',
  },
  {
    id: 'sql-gin-create',
    indexType: 'gin',
    title: 'GIN Index pada Array & Full-Text Search',
    category: 'CREATE INDEX',
    tableContext: 'film (kolom special_features text[] & fulltext tsvector)',
    description:
      'Membuat GIN Index untuk pencarian elemen di dalam Array (operator @> dan &&) serta pencarian kata dokumen pada kolom tsvector.',
    sql: `-- 1. GIN Index pada kolom Array special_features\nCREATE INDEX idx_film_special_features_gin\nON film USING GIN (special_features);\n\n-- Mencari film yang memiliki fitur 'Trailers' DAN 'Deleted Scenes'\nEXPLAIN ANALYZE\nSELECT film_id, title, special_features\nFROM film\nWHERE special_features @> ARRAY['Trailers', 'Deleted Scenes'];\n\n-- 2. GIN Index untuk Full-Text Search\nCREATE INDEX idx_film_fulltext_gin\nON film USING GIN (fulltext);\n\nEXPLAIN ANALYZE\nSELECT film_id, title\nFROM film\nWHERE fulltext @@ to_tsquery('english', 'dinosaur & drama');`,
    expectedPlanNote:
      'Menggunakan Bitmap Index Scan pada GIN index untuk mengambil irisan (intersection) posting list dari kedua token.',
  },
  {
    id: 'sql-gist-create',
    indexType: 'gist',
    title: 'GiST Index untuk Pencarian Geometri & Spasial',
    category: 'CREATE INDEX',
    tableContext: 'store_locations (kolom koordinat point / box)',
    description:
      'Membuat GiST Index (R-Tree) untuk mencari objek di dalam kotak batas (bounding box &&) serta pencarian lokasi terdekat (Nearest-Neighbor <->).',
    sql: `-- Membuat GiST Index pada kolom bertipe point/box\nCREATE INDEX idx_store_coords_gist\nON store_locations USING GIST (coordinates);\n\n-- 1. Mencari cabang toko di dalam area Bounding Box\nEXPLAIN ANALYZE\nSELECT store_id, store_name, coordinates\nFROM store_locations\nWHERE coordinates <@ box '((10,10),(45,45))';\n\n-- 2. Mencari 3 toko terdekat dari titik (25, 30) dengan operator KNN (<->)\nEXPLAIN ANALYZE\nSELECT store_id, store_name, coordinates\nFROM store_locations\nORDER BY coordinates <-> point '(25,30)'\nLIMIT 3;`,
    expectedPlanNote:
      'Memangkas cabang MBR yang tidak berpotongan dengan area pencarian dan mengurutkan jarak langsung melalui Index Scan.',
  },
  {
    id: 'sql-brin-create',
    indexType: 'brin',
    title: 'BRIN Index pada Tabel Kronologis rental(rental_date)',
    category: 'CREATE INDEX',
    tableContext: 'rental (data transaksi berurutan waktu)',
    description:
      'Membuat BRIN Index yang sangat hemat ukuran untuk kolom tanggal yang nilainya berkorelasi kuat dengan urutan blok fisik di disk.',
    sql: `-- Membuat BRIN Index pada kolom rental_date\nCREATE INDEX idx_rental_date_brin\nON rental USING BRIN (rental_date)\nWITH (pages_per_range = 32);\n\n-- Menguji eliminasi blok pada rentang tanggal tertentu\nEXPLAIN ANALYZE\nSELECT rental_id, customer_id, rental_date\nFROM rental\nWHERE rental_date >= '2005-08-01' AND rental_date < '2005-08-03';`,
    expectedPlanNote:
      'Menjalankan Bitmap Index Scan pada BRIN summary untuk mengeliminasi blok di luar Agustus 2005, lalu Bitmap Heap Scan pada blok yang lolos.',
  },
  {
    id: 'sql-spgist-create',
    indexType: 'spgist',
    title: 'SP-GiST Index (Quadtree / Radix Partitioning)',
    category: 'CREATE INDEX',
    tableContext: 'customer_map (titik koordinat & prefix teks)',
    description:
      'Membuat SP-GiST Index yang mempartisi ruang secara non-overlapping (Quadtree untuk point, Radix tree untuk text/inet).',
    sql: `-- 1. SP-GiST Quadtree pada kolom point\nCREATE INDEX idx_customer_point_spgist\nON customer_map USING SPGIST (location_point);\n\n-- 2. SP-GiST Radix Tree untuk pencarian prefix teks (^@)\nCREATE INDEX idx_film_title_spgist\nON film USING SPGIST (title);\n\nEXPLAIN ANALYZE\nSELECT film_id, title\nFROM film\nWHERE title ^@ 'ACA';`,
    expectedPlanNote:
      'Menelusuri partisi ruang tunggal (tanpa tumpang-tindih cabang) menuju kuadran atau node prefix yang sesuai.',
  },
  {
    id: 'sql-bloom-create',
    indexType: 'bloom',
    title: 'Bloom Index untuk Multi-Column Filtering',
    category: 'EXTENSION & TUNING',
    tableContext: 'rental (customer_id, staff_id, inventory_id)',
    description:
      'Mengaktifkan ekstensi bloom dan membuat index probabilistik multi-kolom. Cocok saat query memfilter kombinasi kolom secara acak.',
    sql: `-- Mengaktifkan ekstensi Bloom bawaan contrib PostgreSQL\nCREATE EXTENSION IF NOT EXISTS bloom;\n\n-- Membuat Bloom Index pada beberapa kolom sekaligus\nCREATE INDEX idx_rental_bloom\nON rental USING BLOOM (customer_id, staff_id)\nWITH (length = 80, col1 = 2, col2 = 2);\n\n-- Tetap menggunakan index meskipun hanya memfilter kolom kedua!\nEXPLAIN ANALYZE\nSELECT rental_id, customer_id, staff_id\nFROM rental\nWHERE staff_id = 2 AND customer_id = 45;`,
    expectedPlanNote:
      'Bitmap Index Scan memeriksa signature bit setiap baris, diikuti Bitmap Heap Scan dengan "Rows Removed by Index Recheck" (False Positives).',
  },
];

export const PERF_LAB_SCENARIOS: PerfScenario[] = [
  {
    id: 'scen-range-rental-date',
    title: 'Skenario 1: Range Query pada Data Transaksi Terurut (rental_date)',
    table: 'rental',
    description:
      'Mencari transaksi penyewaan DVD dalam rentang 2 hari tertentu pada tabel rental yang baris-barisnya disimpan berurutan berdasarkan waktu.',
    sqlQuery: `SELECT rental_id, customer_id, rental_date\nFROM rental\nWHERE rental_date BETWEEN '2005-07-28 00:00' AND '2005-07-29 23:59';`,
    whereClauseDescription: 'Range Query (BETWEEN) pada kolom timestamp terurut fisik',
    selectivityRatio: 0.015, // 1.5% of rows
    recommendedIndex: 'btree',
    alternativeIndex: 'brin',
    availableIndexes: ['btree', 'brin', 'hash', 'bloom'],
    explanationId:
      'B-Tree memberikan waktu pencarian paling presisi karena langsung melompat ke leaf tanggal awal dan menyusuri leaf berurutan. Namun BRIN menawarkan alternatif dengan ukuran index ~100x lebih kecil yang tetap mampu mengeliminasi >95% blok fisik! Sebaliknya, Hash dan Bloom TIDAK mendukung operator BETWEEN sehingga akan jatuh kembali ke Seq Scan.',
  },
  {
    id: 'scen-equality-film-id',
    title: 'Skenario 2: Point Lookup / Equality pada Kolom Kode (rating / code)',
    table: 'film',
    description:
      'Mencari baris dengan kecocokan eksak (=) menggunakan kode unik atau pengenal spesifik dengan selektivitas tinggi (0.2% baris).',
    sqlQuery: `SELECT film_id, title, rental_rate, rating\nFROM film\nWHERE film_code = 'FLM-08421';`,
    whereClauseDescription: 'Equality Lookup (=) dengan selektivitas tinggi',
    selectivityRatio: 0.002,
    recommendedIndex: 'hash',
    alternativeIndex: 'btree',
    availableIndexes: ['btree', 'hash', 'brin', 'bloom'],
    explanationId:
      'Untuk pencarian ekuivalensi murni (=), baik Hash Index maupun B-Tree sangat cepat dibandingkan Seq Scan. Hash Index langsung menghitung bucket O(1) dengan ukuran index lebih ramping untuk string panjang, sementara B-Tree menelusuri pohon logaritmik O(log N) namun punya keunggulan fleksibilitas bila nanti dibutuhkan ORDER BY.',
  },
  {
    id: 'scen-multicolumn-nonleading',
    title: 'Skenario 3: Multi-Column Filter Tanpa Leading Column (staff_id & store_id)',
    table: 'rental',
    description:
      'Tabel memiliki index multi-kolom pada (customer_id, staff_id, inventory_id), namun pengguna menjalankan query yang HANYA memfilter staff_id dan inventory_id (tanpa customer_id).',
    sqlQuery: `SELECT rental_id, customer_id, staff_id, inventory_id\nFROM rental\nWHERE staff_id = 2 AND inventory_id = 1045;`,
    whereClauseDescription: 'Equality pada subset kolom non-leading',
    selectivityRatio: 0.008,
    recommendedIndex: 'bloom',
    alternativeIndex: 'btree_multicolumn',
    availableIndexes: ['bloom', 'btree_multicolumn', 'btree'],
    explanationId:
      'Multicolumn B-Tree pada (customer_id, staff_id, inventory_id) kehilangan efisiensinya ketika kolom pertama (customer_id) tidak disertakan di WHERE, sehingga optimizer sering terpaksa melakukan Seq Scan atau full index scan. Sebaliknya, Bloom Index tetap dapat menyaring signature bit untuk kolom mana pun secara independen (dengan sedikit overhead Recheck False Positive).',
  },
  {
    id: 'scen-array-containment',
    title: 'Skenario 4: Pencarian Elemen Array / Full-Text (special_features @>)',
    table: 'film',
    description:
      'Mencari seluruh film yang memiliki kombinasi fitur khusus "Behind the Scenes" dan "Commentaries" di dalam kolom array.',
    sqlQuery: `SELECT film_id, title, special_features\nFROM film\nWHERE special_features @> ARRAY['Behind the Scenes', 'Commentaries'];`,
    whereClauseDescription: 'Array Containment (@>) pada kolom multi-value',
    selectivityRatio: 0.035,
    recommendedIndex: 'gin',
    alternativeIndex: 'gist',
    availableIndexes: ['gin', 'gist', 'btree', 'hash'],
    explanationId:
      'GIN Index memetakan setiap elemen array ke Posting List ctid sehingga irisan dua elemen ditemukan seketika melalui Bitmap Index Scan. B-Tree dan Hash standar tidak memahami isi elemen di dalam array (@>) sehingga akan jatuh ke Seq Scan.',
  },
  {
    id: 'scen-spatial-box',
    title: 'Skenario 5: Pencarian Spasial 2D Bounding Box & Nearest Neighbor',
    table: 'store_locations',
    description:
      'Mencari titik cabang/pelanggan yang berada di dalam area koordinat geografis tertentu (2D Box Overlap).',
    sqlQuery: `SELECT store_id, store_name, coordinates\nFROM store_locations\nWHERE coordinates <@ box '((20,20),(35,35))';`,
    whereClauseDescription: 'Spatial 2D Containment (<@) pada titik koordinat',
    selectivityRatio: 0.025,
    recommendedIndex: 'gist',
    alternativeIndex: 'spgist',
    availableIndexes: ['gist', 'spgist', 'btree', 'brin'],
    explanationId:
      'GiST (R-Tree) dan SP-GiST (Quadtree) memangkas ruang 2 dimensi secara hierarkis. SP-GiST sangat unggul untuk titik (point) karena kuadrannya tidak saling tumpang-tindih, sedangkan GiST sangat fleksibel untuk poligon maupun jarak terdekat (<->).',
  },
];

