import {chapterOf, digits, pure99} from '../hts.ts';
import type {SearchFilters} from '../types.ts';

/**
 * Current production filter semantics, preserved on purpose:
 * `commercial` and `exclude99` both drop Chapter 99 unless both are off.
 * `commercial` does not drop 10-digit statistical suffixes.
 * `statistical` keeps only 10+ digit lines.
 * `strictFamily` keeps only the selected family's chapters.
 */
export function matchesFilters(hts: string, filters: SearchFilters, familyChapters: string[]): boolean {
  const keepChapter99 = !filters.exclude99 && !filters.commercial;
  if (!keepChapter99 && pure99(hts)) return false;
  if (filters.statistical && digits(hts).length < 10) return false;
  if (filters.strictFamily && familyChapters.length > 0 && !familyChapters.includes(chapterOf(hts))) return false;
  return true;
}
