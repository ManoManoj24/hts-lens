import test from 'node:test';
import assert from 'node:assert/strict';
import {assistWithJev, reorderWithAssist, resetJevState, JEV_MODEL, type FetchLike, type JevAssist} from '../lib/jev.ts';

const candidates = [
  {hts: '1', description: 'glass cups', hierarchyParts: 'glass'},
  {hts: '2', description: 'ceramic mugs', hierarchyParts: 'ceramic tableware'},
];

const successBody = {
  model: JEV_MODEL,
  answers: {
    best_candidate: {choice: 'candidate_1', confidence: 0.9},
    facts_sufficient: {noul: 0.8},
    fit_0: {noul: 0.2},
    fit_1: {noul: 0.91},
  },
  usage: {input_tokens: 1000},
};

function reply(status = 200, body: object = successBody): FetchLike {
  return async () => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}});
}

test('off by default', async () => {
  delete process.env.JEV_AI_ENABLED;
  assert.equal((await assistWithJev('ceramic mug', candidates, reply())).status, 'off');
});

test('reranks only a validated candidate', async () => {
  process.env.JEV_AI_ENABLED = 'true';
  process.env.JEV_API_KEY = 'test';
  resetJevState();
  const assist = await assistWithJev('ceramic mug', candidates, reply());
  assert.equal(assist.status, 'ok');
  assert.equal(reorderWithAssist(candidates, assist)[0].hts, '2');
  assert.equal(assist.estimatedCostUsd, 0.000042);
});

test('sorts all successful fits with lexical score as the tie-breaker', () => {
  const items = [{hts: 'a', score: 30}, {hts: 'b', score: 20}, {hts: 'c', score: 40}, {hts: 'd', score: 99}];
  const assist: JevAssist = {status: 'ok', fits: {a: 0.4, b: 0.9, c: 0.4}};
  assert.deepEqual(reorderWithAssist(items, assist).map(item => item.hts), ['b', 'c', 'a', 'd']);
});

test('cached success reranks while inconclusive remains lexical', () => {
  const items = [{hts: 'a', score: 30}, {hts: 'b', score: 20}];
  assert.equal(reorderWithAssist(items, {status: 'cached', fits: {a: 0.1, b: 0.8}})[0].hts, 'b');
  assert.equal(reorderWithAssist(items, {status: 'inconclusive', fits: {a: 0.1, b: 0.8}})[0].hts, 'a');
});

test('low sufficiency abstains', async () => {
  process.env.JEV_AI_ENABLED = 'true';
  process.env.JEV_API_KEY = 'test';
  resetJevState();
  const body = {
    model: JEV_MODEL,
    answers: {
      best_candidate: {choice: 'candidate_1', confidence: 0.9},
      facts_sufficient: {noul: 0.2},
      fit_0: {noul: 0.1},
      fit_1: {noul: 0.9},
    },
    usage: {input_tokens: 500},
  };
  assert.equal((await assistWithJev('mug', candidates, reply(200, body))).status, 'inconclusive');
});

test('API failure preserves fallback status', async () => {
  process.env.JEV_AI_ENABLED = 'true';
  process.env.JEV_API_KEY = 'test';
  resetJevState();
  assert.equal((await assistWithJev('mug', candidates, reply(401, {}))).status, 'temporarily_unavailable');
});

test('identical request is cached', async () => {
  process.env.JEV_AI_ENABLED = 'true';
  process.env.JEV_API_KEY = 'test';
  resetJevState();
  let calls = 0;
  const fetcher: FetchLike = async () => {
    calls += 1;
    return reply()();
  };
  await assistWithJev('ceramic mug', candidates, fetcher);
  const assist = await assistWithJev('ceramic mug', candidates, fetcher);
  assert.equal(assist.status, 'cached');
  assert.equal(calls, 1);
});

test('reorder never inserts an HTS code that was not retrieved', () => {
  const items = [{hts: '6912.00', score: 10}];
  const assist: JevAssist = {status: 'ok', fits: {'6912.00': 0.2, '9999.99.99': 0.99}};
  const ranked = reorderWithAssist(items, assist);
  assert.deepEqual(ranked.map(item => item.hts), ['6912.00']);
});
