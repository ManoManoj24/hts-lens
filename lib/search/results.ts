import {publishedDuty} from '../duty.ts';
import {chaptersFor, formatUnit, hasDutyIntent, lineTypeOf, officialLinks} from '../hts.ts';
import {reorderWithAssist, type JevAssist} from '../jev.ts';
import {scoreHit} from '../ranking/score.ts';
import type {SearchHit, SearchQuery, SearchResult} from '../types.ts';

export function toSearchResult(hit: SearchHit, index: number, query: SearchQuery): SearchResult {
  const ctx = {query: query.q, familyChapters: chaptersFor(query.family), dutyIntent: hasDutyIntent(query.q)};
  const links = officialLinks(hit.h);
  return {
    hts: hit.h,
    description: hit.d,
    hierarchy: hit.p,
    hierarchyParts: (hit.p ? `${hit.p} > ` : '') + hit.d,
    unit: formatUnit(hit.u),
    general: publishedDuty(hit.g),
    special: hit.s,
    column2: hit.c,
    additional: hit.a,
    lineType: lineTypeOf(hit.h),
    score: Number(scoreHit(hit, ctx).toFixed(2)),
    label: index === 0 ? 'Top match' : 'Also consider',
    source: links.source,
    cross: links.cross,
    futureDutyContext: {origin: null, chapter99: [], tradePrograms: []},
  };
}

/** Attach Jev fit only for retrieved candidates. Extra keys in `assist.fits` never create new HTS rows. */
function withRetrievedFit(result: SearchResult, fits: Record<string, number> | undefined): Pick<SearchResult, 'aiFit'> | Record<string, never> {
  if (!fits) return {};
  return {aiFit: Number(fits[result.hts] ?? 0)};
}

/** AI Assist may reorder this list and attach fit scores. It never adds or invents HTS codes. */
export function applyAssistRanking(results: SearchResult[], assist: JevAssist): SearchResult[] {
  const ranked = reorderWithAssist(results, assist);
  const usedFitOrder = Boolean(assist.fits);
  return ranked.map((result, index) => ({
    ...result,
    ...withRetrievedFit(result, assist.fits),
    label: index === 0 ? (usedFitOrder ? 'AI-assisted ranking' : 'Top match') : 'Also consider',
  }));
}
