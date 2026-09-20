import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureOfficialHeadings, scoreHit} from '../lib/ranking/score.ts';
import {applyAssistRanking, toSearchResult} from '../lib/search/results.ts';
import type {SearchHit, SearchQuery, SearchResult} from '../lib/types.ts';

const baseQuery: SearchQuery = {
  q: 'ceramic mug',
  commercial: true,
  exclude99: true,
  statistical: false,
  family: 'all',
  strictFamily: false,
  ai: false,
  facts: {},
};

function hit(partial: Partial<SearchHit> & Pick<SearchHit, 'h'>): SearchHit {
  return {i: 0, d: '', p: '', u: '', g: '', s: '', c: '', a: '', score: 10, ...partial};
}

test('family chapters receive a ranking boost', () => {
  const row = hit({h: '6912.00', d: 'Ceramic tableware', score: 10});
  const without = scoreHit(row, {query: 'mug', familyChapters: [], dutyIntent: false});
  const withFamily = scoreHit(row, {query: 'mug', familyChapters: ['69'], dutyIntent: false});
  assert.equal(withFamily - without, 35);
});

test('Chapter 99 is penalized unless the query has duty intent', () => {
  const row = hit({h: '9903.88.01', d: 'Additional duty', score: 40});
  const quiet = scoreHit(row, {query: 'steel', familyChapters: [], dutyIntent: false});
  const intent = scoreHit(row, {query: 'section 301', familyChapters: [], dutyIntent: true});
  assert.ok(quiet < intent);
  assert.equal(intent - quiet, 80);
});

test('mug and battery queries apply description-sensitive boosts', () => {
  const mug = hit({h: '6912.00.44.00', d: 'Mugs and other steins', p: 'Ceramic tableware', score: 10});
  const battery = hit({h: '8507.60.00', d: 'Rechargeable battery', score: 10});
  const ctx = {familyChapters: [] as string[], dutyIntent: false};
  assert.equal(
    scoreHit(mug, {...ctx, query: 'ceramic mug'}) - scoreHit(mug, {...ctx, query: 'ceramic bowl'}),
    55,
  );
  assert.equal(
    scoreHit(battery, {...ctx, query: 'car battery'}) - scoreHit(battery, {...ctx, query: 'lithium cell'}),
    15,
  );
});

test('other descriptions are slightly down-ranked', () => {
  const specific = hit({h: '6109.10.00', d: 'Of cotton', score: 20});
  const other = hit({h: '6109.90.10', d: 'Other', score: 20});
  const ctx = {query: 't-shirt', familyChapters: [], dutyIntent: false};
  assert.ok(scoreHit(specific, ctx) > scoreHit(other, ctx));
});

test('ensureOfficialHeadings only pins codes already in the catalog extras', () => {
  const hits = [hit({h: '3918.10.10', d: 'Vinyl tile', score: 80}), hit({h: '5702.32.10.00', d: 'Wool carpet', score: 40})];
  const extras = [hit({h: '6907', d: 'Ceramic tiles', score: 0})];
  const merged = ensureOfficialHeadings(hits, extras, 12);
  assert.deepEqual(merged.map(item => item.h), ['3918.10.10', '5702.32.10.00', '6907']);
});

test('AI assist ranking permutes retrieved codes and never inserts a new HTS number', () => {
  const retrieved = [
    toSearchResult(hit({h: '6912.00', d: 'Ceramic tableware', score: 30}), 0, baseQuery),
    toSearchResult(hit({h: '3924.10', d: 'Plastic tableware', score: 20}), 1, baseQuery),
  ];
  const ranked = applyAssistRanking(retrieved, {status: 'ok', fits: {'6912.00': 0.2, '3924.10': 0.9, '9999.99': 0.99}});
  assert.deepEqual(ranked.map(item => item.hts).sort(), ['3924.10', '6912.00']);
  assert.equal(ranked[0].hts, '3924.10');
  assert.equal(ranked[0].label, 'AI-assisted ranking');
  assert.equal(ranked[0].aiFit, 0.9);
  assert.equal(ranked[1].aiFit, 0.2);
  const leaked = ranked.some(item => !retrieved.some(original => original.hts === item.hts));
  assert.equal(leaked, false);
});

test('inconclusive assist with fits reorders by AI fit and never inserts a new HTS number', () => {
  const retrieved: SearchResult[] = [
    toSearchResult(hit({h: '6912.00', d: 'Ceramic tableware', score: 30}), 0, baseQuery),
    toSearchResult(hit({h: '6912.00.44.00', d: 'Mugs and other steins', score: 20}), 1, baseQuery),
  ];
  const fits = {'6912.00': 0.2, '6912.00.44.00': 0.82, leaked: 0.99};
  const ranked = applyAssistRanking(retrieved, {status: 'inconclusive', fits});

  assert.deepEqual(ranked.map(item => item.hts), ['6912.00.44.00', '6912.00']);
  assert.equal(ranked[0].label, 'AI-assisted ranking');
  assert.equal(ranked[0].aiFit, 0.82);
  assert.equal(ranked[1].aiFit, 0.2);
  assert.equal(ranked.some(item => item.hts === 'leaked'), false);
});

test('ok and cached assist still reorder by AI fit', () => {
  const retrieved: SearchResult[] = [
    toSearchResult(hit({h: 'a', d: 'A', score: 30}), 0, baseQuery),
    toSearchResult(hit({h: 'b', d: 'B', score: 10}), 1, baseQuery),
  ];
  const fits = {a: 0.1, b: 0.9, leaked: 0.99};
  const ok = applyAssistRanking(retrieved, {status: 'ok', fits});
  const cached = applyAssistRanking(retrieved, {status: 'cached', fits});

  assert.deepEqual(ok.map(item => item.hts), ['b', 'a']);
  assert.deepEqual(cached.map(item => item.hts), ['b', 'a']);
  assert.equal(ok[0].label, 'AI-assisted ranking');
  assert.equal(cached[0].label, 'AI-assisted ranking');
  assert.equal(ok[0].aiFit, 0.9);
  assert.equal(cached[0].aiFit, 0.9);
  assert.equal(ok.some(item => item.hts === 'leaked'), false);
});

test('assist without fits keeps original order and omits aiFit', () => {
  const retrieved: SearchResult[] = [
    toSearchResult(hit({h: 'a', d: 'A', score: 30}), 0, baseQuery),
    toSearchResult(hit({h: 'b', d: 'B', score: 10}), 1, baseQuery),
  ];
  const ranked = applyAssistRanking(retrieved, {status: 'inconclusive'});
  assert.deepEqual(ranked.map(item => item.hts), ['a', 'b']);
  assert.equal(ranked[0].label, 'Top match');
  assert.equal(ranked[0].aiFit, undefined);
  assert.equal(ranked[1].aiFit, undefined);
});
