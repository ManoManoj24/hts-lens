import {isProductFamily} from '../hts.ts';
import {FACT_KEYS, type ProductFacts, type SearchQuery} from '../types.ts';

export function parseSearchParams(params: URLSearchParams): SearchQuery {
  const familyRaw = params.get('family') || 'all';
  const family = isProductFamily(familyRaw) ? familyRaw : 'all';
  const facts = Object.fromEntries(
    FACT_KEYS.map(key => [key, (params.get(key) || '').trim().slice(0, 160)] as const).filter(([, value]) => value),
  ) as Partial<ProductFacts>;
  return {
    q: (params.get('q') || '').trim().slice(0, 120),
    commercial: params.get('commercial') === '1',
    exclude99: params.get('exclude99') === '1',
    statistical: params.get('statistical') === '1',
    family,
    strictFamily: params.get('strictFamily') === '1' && family !== 'all',
    ai: params.get('ai') === '1',
    facts,
  };
}

export function productState(query: SearchQuery): string {
  if (Object.keys(query.facts).length === 0) return query.q;
  return JSON.stringify({description: query.q, ...query.facts});
}
