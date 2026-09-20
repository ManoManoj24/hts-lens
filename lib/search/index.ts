import MiniSearch from 'minisearch';
import records from '../../data/hts.normalized.json' with {type: 'json'};
import {assistWithJev} from '../jev.ts';
import {chaptersFor, expandQuery, hasDutyIntent, isCeramicTileQuery} from '../hts.ts';
import {matchesFilters} from '../ranking/filters.ts';
import {ensureOfficialHeadings, scoreHit} from '../ranking/score.ts';
import type {HtsRow, IndexedRow, SearchHit, SearchQuery, SearchResult} from '../types.ts';
import {productState} from './params.ts';
import {applyAssistRanking, toSearchResult} from './results.ts';

export {parseSearchParams, productState} from './params.ts';
export {applyAssistRanking, toSearchResult} from './results.ts';

const SHORTLIST_SIZE = 12;
const CERAMIC_TILE_HEADINGS = ['6907'] as const;

let rows: HtsRow[] | undefined;
let index: MiniSearch<IndexedRow> | undefined;

export function getRows(): HtsRow[] {
  if (!rows) rows = records as HtsRow[];
  return rows;
}

export function getIndex(): MiniSearch<IndexedRow> {
  if (!index) {
    index = new MiniSearch<IndexedRow>({
      fields: ['d', 'p', 'h'],
      storeFields: ['h', 'i', 'd', 'p', 'u', 'g', 's', 'c', 'a'],
      searchOptions: {boost: {d: 5, p: 1.1, h: 6}, prefix: true, fuzzy: 0.15, combineWith: 'OR'},
    });
    index.addAll(getRows().map((row, id) => ({...row, id})));
  }
  return index;
}

function toHit(row: HtsRow, score = 0): SearchHit {
  return {...row, score};
}

function asSearchHit(value: Partial<HtsRow> & {score?: number}): SearchHit {
  return {
    h: value.h ?? '',
    i: Number(value.i || 0),
    d: value.d ?? '',
    p: value.p ?? '',
    u: value.u ?? '',
    g: value.g ?? '',
    s: value.s ?? '',
    c: value.c ?? '',
    a: value.a ?? '',
    score: Number(value.score || 0),
  };
}

export function retrieveHits(query: SearchQuery, searchIndex = getIndex(), catalog = getRows()): SearchHit[] {
  const familyChapters = chaptersFor(query.family);
  const ctx = {query: query.q, familyChapters, dutyIntent: hasDutyIntent(query.q)};
  const expanded = expandQuery(query.q);
  let hits = searchIndex
    .search(expanded, {prefix: true, fuzzy: query.q.length > 5 ? 0.15 : false})
    .map(hit => asSearchHit(hit));
  hits = hits.filter(hit => matchesFilters(hit.h, query, familyChapters));
  hits.sort((a, b) => scoreHit(b, ctx) - scoreHit(a, ctx));
  if (isCeramicTileQuery(query.q)) {
    const extras = catalog.filter(row => (CERAMIC_TILE_HEADINGS as readonly string[]).includes(row.h)).map(row => toHit(row, 0));
    hits = ensureOfficialHeadings(hits, extras, SHORTLIST_SIZE);
  }
  return hits.slice(0, SHORTLIST_SIZE);
}

export function searchHts(query: SearchQuery): SearchResult[] {
  return retrieveHits(query).map((hit, index) => toSearchResult(hit, index, query));
}

export async function searchWithOptionalAssist(query: SearchQuery): Promise<{results: SearchResult[]; aiAssist: Awaited<ReturnType<typeof assistWithJev>>}> {
  let results = searchHts(query);
  const aiAssist = query.ai ? await assistWithJev(productState(query), results) : {status: 'off' as const};
  results = applyAssistRanking(results, aiAssist);
  return {results, aiAssist};
}
