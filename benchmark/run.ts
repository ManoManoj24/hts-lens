import {searchHts} from '../lib/search/index.ts';
import cases from './cases.json' with {type: 'json'};
import type {SearchQuery} from '../lib/types.ts';

const queryFor = (description: string): SearchQuery => ({
  q: description,
  commercial: true,
  exclude99: true,
  statistical: false,
  family: 'all',
  strictFamily: false,
  ai: false,
  facts: {},
});

const scored = cases.map(testCase => {
  const hits = searchHts(queryFor(testCase.description)).map(result => result.hts);
  return {
    ...testCase,
    hits,
    top1: hits[0]?.replace(/\./g, '').startsWith(testCase.expected) || false,
    top3: hits.some(code => code.replace(/\./g, '').startsWith(testCase.expected)),
  };
});

const pct = (count: number) => `${(100 * count / cases.length).toFixed(1)}%`;
console.table(scored.map(row => ({id: row.id, expected: row.expected, top: row.hits[0], top1: row.top1, top3: row.top3})));
console.log({
  cases: cases.length,
  headingTop1: pct(scored.filter(row => row.top1).length),
  headingTop3: pct(scored.filter(row => row.top3).length),
});
