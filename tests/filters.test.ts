import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesFilters} from '../lib/ranking/filters.ts';
import {chaptersFor} from '../lib/hts.ts';
import {parseSearchParams} from '../lib/search/params.ts';
import type {SearchFilters} from '../lib/types.ts';

const base: SearchFilters = {
  commercial: false,
  exclude99: false,
  statistical: false,
  family: 'all',
  strictFamily: false,
};

test('exclude99 drops Chapter 99 lines', () => {
  assert.equal(matchesFilters('9903.88.01', {...base, exclude99: true}, []), false);
  assert.equal(matchesFilters('6109.10.00', {...base, exclude99: true}, []), true);
});

test('commercial also drops Chapter 99 and currently keeps statistical suffixes', () => {
  assert.equal(matchesFilters('9903.88.01', {...base, commercial: true}, []), false);
  assert.equal(matchesFilters('6912.00.44.00', {...base, commercial: true}, []), true);
  assert.equal(matchesFilters('6912.00', {...base, commercial: true}, []), true);
});

test('Chapter 99 is visible only when both commercial and exclude99 are off', () => {
  assert.equal(matchesFilters('9903.88.01', base, []), true);
  assert.equal(matchesFilters('9903.88.01', {...base, commercial: true, exclude99: false}, []), false);
  assert.equal(matchesFilters('9903.88.01', {...base, commercial: false, exclude99: true}, []), false);
});

test('statistical keeps only 10-digit and longer codes', () => {
  assert.equal(matchesFilters('6109', {...base, statistical: true}, []), false);
  assert.equal(matchesFilters('6109.10.00', {...base, statistical: true}, []), false);
  assert.equal(matchesFilters('6109.10.00.04', {...base, statistical: true}, []), true);
});

test('strictFamily keeps only the selected family’s chapters', () => {
  const textiles = chaptersFor('textiles');
  assert.equal(matchesFilters('6109.10.00', {...base, family: 'textiles', strictFamily: true}, textiles), true);
  assert.equal(matchesFilters('8471.30.01.00', {...base, family: 'textiles', strictFamily: true}, textiles), false);
  assert.equal(matchesFilters('8471.30.01.00', {...base, family: 'textiles', strictFamily: false}, textiles), true);
});

test('parseSearchParams reads flags, family, and filled facts only', () => {
  const parsed = parseSearchParams(new URLSearchParams({
    q: '  ceramic mug  ',
    commercial: '1',
    exclude99: '1',
    family: 'ceramics',
    strictFamily: '1',
    ai: '1',
    material: 'stoneware',
    use: '',
  }));
  assert.equal(parsed.q, 'ceramic mug');
  assert.equal(parsed.commercial, true);
  assert.equal(parsed.exclude99, true);
  assert.equal(parsed.family, 'ceramics');
  assert.equal(parsed.strictFamily, true);
  assert.equal(parsed.ai, true);
  assert.deepEqual(parsed.facts, {material: 'stoneware'});
});

test('unknown family values fall back to all chapters', () => {
  const parsed = parseSearchParams(new URLSearchParams({q: 'mug', family: 'spaceships', strictFamily: '1'}));
  assert.equal(parsed.family, 'all');
  assert.equal(parsed.strictFamily, false);
});
