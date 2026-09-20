import type {HtsRow, LineType, ProductFamily} from './types.ts';

export function digits(hts: string): string {
  return hts.replace(/\D/g, '');
}

export function pure99(hts: string): boolean {
  return hts.replace(/\./g, '').startsWith('99');
}

export function chapterOf(hts: string): string {
  return digits(hts).slice(0, 2);
}

export function lineTypeOf(hts: string): LineType {
  if (pure99(hts)) return 'chapter-99';
  if (digits(hts).length >= 10) return 'statistical';
  return 'commercial';
}

export const QUERY_ALIASES: Record<string, string[]> = {
  laptop: ['portable automatic data processing machine', 'notebook computer'],
  smartphone: ['telephone for cellular networks', 'smart phone'],
  automobile: ['motor car', 'passenger vehicle'],
  car: ['motor car', 'passenger vehicle'],
  mug: ['tableware kitchenware ceramic drinking vessel'],
  'solar panel': ['photovoltaic module panel'],
  't-shirt': ['t-shirts singlets knitted cotton'],
};

export const FAMILY_CHAPTERS: Record<Exclude<ProductFamily, 'all'>, string[]> = {
  food: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'],
  textiles: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
  bags: ['41', '42', '43', '64'],
  ceramics: ['68', '69', '70'],
  machinery: ['84', '85', '90', '91'],
  transport: ['86', '87', '88', '89'],
  furniture: ['94', '95', '96'],
};

export function chaptersFor(family: ProductFamily): string[] {
  if (family === 'all') return [];
  return FAMILY_CHAPTERS[family] ?? [];
}

export function isProductFamily(value: string): value is ProductFamily {
  return value === 'all' || value in FAMILY_CHAPTERS;
}

export function expandQuery(query: string): string {
  const lower = query.toLowerCase();
  const extras = Object.entries(QUERY_ALIASES)
    .filter(([key]) => lower.includes(key))
    .flatMap(([, aliases]) => aliases);
  return [query, ...extras].join(' ');
}

export function hasDutyIntent(query: string): boolean {
  return /section\s*(301|232)|additional dut|chapter\s*99|china tariff|origin|trade remedy/i.test(query);
}

export function isCeramicTileQuery(query: string): boolean {
  return /(?:porcelain|ceramic).*tile|tile.*(?:porcelain|ceramic)/i.test(query);
}

export function formatUnit(value: string | undefined | null): string {
  const text = value?.trim() ?? '';
  if (!text) return 'Not specified';
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const parts = parsed.map(part => String(part).trim()).filter(Boolean);
      return parts.join(', ') || 'Not specified';
    }
  } catch {
    // Official unit cells are sometimes already plain text.
  }
  return text;
}

export function officialLinks(hts: string): {source: string; cross: string} {
  return {
    source: `https://hts.usitc.gov/search?query=${encodeURIComponent(hts)}`,
    cross: `https://rulings.cbp.gov/search?term=${encodeURIComponent(hts)}`,
  };
}

export function asRow(value: unknown): HtsRow | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Partial<HtsRow>;
  if (typeof row.h !== 'string' || typeof row.d !== 'string') return undefined;
  return {
    h: row.h,
    i: Number(row.i || 0),
    d: row.d,
    p: row.p ?? '',
    u: row.u ?? '',
    g: row.g ?? '',
    s: row.s ?? '',
    c: row.c ?? '',
    a: row.a ?? '',
  };
}
