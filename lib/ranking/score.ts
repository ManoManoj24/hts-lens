import {chapterOf, digits, pure99} from '../hts.ts';
import type {SearchHit} from '../types.ts';

export type ScoreContext = {
  query: string;
  familyChapters: string[];
  dutyIntent: boolean;
};

/** Lexical MiniSearch score plus the production ranking adjustments. Pure and testable. */
export function scoreHit(hit: Pick<SearchHit, 'h' | 'd' | 'p' | 'score'>, ctx: ScoreContext): number {
  let score = hit.score;
  const lower = ctx.query.toLowerCase();
  if (ctx.familyChapters.includes(chapterOf(hit.h))) score += 35;
  const n = digits(hit.h).length;
  if (pure99(hit.h) && !ctx.dutyIntent) score -= 80;
  if (!pure99(hit.h)) score += 18;
  if (n === 4 || n === 6 || n === 8) score += 10;
  if (n === 10) score += 4;
  if (/other/i.test(hit.d)) score -= 3;
  if (lower.includes('mug') && /mug|drinking|tableware|kitchenware/i.test(`${hit.d} ${hit.p}`)) score += 55;
  if (lower.includes('battery') && /battery/i.test(hit.d)) score += 15;
  return score;
}

export function compareHits(a: SearchHit, b: SearchHit, ctx: ScoreContext): number {
  return scoreHit(b, ctx) - scoreHit(a, ctx);
}

/**
 * Keep retrieved official rows only. Used to pin a known heading (e.g. 6907)
 * into the shortlist without inventing codes that are not in the schedule.
 */
export function ensureOfficialHeadings(hits: SearchHit[], extras: SearchHit[], limit = 12): SearchHit[] {
  const extraCodes = new Set(extras.map(item => item.h));
  const kept = hits.filter(item => !extraCodes.has(item.h));
  const room = Math.max(0, limit - extras.length);
  return [...kept.slice(0, room), ...extras];
}
