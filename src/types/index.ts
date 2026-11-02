export type IndexTypeId =
  | 'btree'
  | 'btree_multicolumn'
  | 'hash'
  | 'gin'
  | 'gist'
  | 'brin'
  | 'spgist'
  | 'bloom';

export type MainMenuTab =
  | 'playground'
  | 'comparison'
  | 'perflab'
  | 'sqlexplorer';

export interface IndexMethodSpec {
  id: IndexTypeId;
  name: string;
  shortName: string;
  badge: string;
  isBonus?: boolean;
  requiresExtension?: string;
  tagline: string;
  summary: string;
  dataStructureName: string;
  howItWorks: string;
  searchMechanism: string;
  supportedOperators: string[];
  suitableQueries: string[];
  notSuitableFor: string[];
  advantages: string[];
  limitations: string[];
  storageProfile: {
    relativeSize: string; // conceptual estimate e.g. 'Sedang (Estimasi konseptual)'
    sizeScore: number; // 1-100 conceptual
    buildCostScore: number; // 1-100 conceptual
    writeOverheadScore: number; // 1-100 conceptual
    description: string;
  };
  operatorSupportMatrix: {
    equality: boolean;
    comparisonRange: boolean;
    sortingOrder: boolean;
    prefixLike: boolean;
    fullTextArrayJsonb: boolean;
    spatialGeometric: boolean;
    multiColumnArbitrary: boolean;
  };
  defaultSqlExample: string;
}

export interface SqlExampleItem {
  id: string;
  indexType: IndexTypeId;
  title: string;
  category: 'CREATE INDEX' | 'EXPLAIN ANALYZE' | 'EXTENSION & TUNING' | 'DROP & MAINTENANCE';
  tableContext: string;
  description: string;
  sql: string;
  expectedPlanNote: string;
}

export interface PerfScenario {
  id: string;
  title: string;
  table: 'film' | 'rental' | 'payment' | 'store_locations';
  description: string;
  sqlQuery: string;
  whereClauseDescription: string;
  selectivityRatio: number; // fraction of rows matched (e.g., 0.005 = 0.5%)
  recommendedIndex: IndexTypeId;
  alternativeIndex: IndexTypeId;
  availableIndexes: IndexTypeId[];
  explanationId: string;
}

export interface SimulatedPlanResult {
  modeLabel: string;
  indexType: IndexTypeId | 'none';
  scanType: 'Seq Scan' | 'Index Scan' | 'Bitmap Heap Scan + Bitmap Index Scan' | 'Seq Scan (Fallback - Operator Unsupported)';
  isSupported: boolean;
  rowsScanned: number;
  rowsReturned: number;
  blocksRead: number;
  totalBlocks: number;
  simulatedTimeMs: number;
  indexSizeKb: number;
  falsePositiveRowsRechecked?: number;
  explainAnalyzeText: string[];
  notes: string;
}

