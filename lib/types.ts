export type HtsRow = {
  h: string;
  i: number;
  d: string;
  p: string;
  u: string;
  g: string;
  s: string;
  c: string;
  a: string;
};

export type IndexedRow = HtsRow & {id: number};

export type SearchHit = HtsRow & {score: number};

export type LineType = 'chapter-99' | 'statistical' | 'commercial';

export type ProductFamily = 'all' | 'food' | 'textiles' | 'bags' | 'ceramics' | 'machinery' | 'transport' | 'furniture';

export const FACT_KEYS = ['material', 'use', 'construction', 'form', 'dimensions', 'power'] as const;
export type FactKey = (typeof FACT_KEYS)[number];
export type ProductFacts = Record<FactKey, string>;

export type SearchFilters = {
  commercial: boolean;
  exclude99: boolean;
  statistical: boolean;
  family: ProductFamily;
  strictFamily: boolean;
};

export type SearchQuery = SearchFilters & {
  q: string;
  ai: boolean;
  facts: Partial<ProductFacts>;
};

export type SearchResult = {
  hts: string;
  description: string;
  hierarchy: string;
  hierarchyParts: string;
  unit: string;
  general: string;
  special: string;
  column2: string;
  additional: string;
  lineType: LineType;
  score: number;
  label: string;
  source: string;
  cross: string;
  aiFit?: number;
  futureDutyContext: {
    origin: null;
    chapter99: [];
    tradePrograms: [];
  };
};

export type Provenance = {
  revision: string;
  revisionNumber: number;
  publishedDate: string;
  lastSynced: string;
  lastSyncedLabel: string;
  source: string;
  sourceCsv: string;
};
