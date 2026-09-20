import {createAssistCache, type AssistCache} from './cache.ts';

export const JEV_MODEL = 'jev-1.13.0';
export type Candidate = {hts: string; description: string; hierarchyParts: string};
export type JevStatus = 'off' | 'ok' | 'cached' | 'inconclusive' | 'budget_exhausted' | 'temporarily_unavailable';
export type JevAssist = {
  status: JevStatus;
  model?: string;
  selectedHts?: string;
  confidence?: number;
  factsSufficient?: number;
  fits?: Record<string, number>;
  inputTokens?: number;
  estimatedCostUsd?: number;
  reason?: string;
};

type ChoiceQuestion = {type: 'choice'; instructions: string; criteria: Record<string, string>};
type NoulQuestion = {type: 'noul'; instructions: string; criteria: {true: string; false: string}};
type JevQuestions = Record<string, ChoiceQuestion | NoulQuestion>;

type JevAnswerLeaf = {choice?: string; confidence?: number; noul?: number};
type JevResponse = {
  model?: string;
  usage?: {input_tokens?: number};
  answers?: Record<string, JevAnswerLeaf | undefined>;
};

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const PRICE_PER_TOKEN = 0.042 / 1_000_000;
const MAX_INPUT_TOKENS = 5000;
const CACHE_TTL_MS = 30 * 86_400_000;
const BUDGET_USD = Number(process.env.JEV_BUDGET_USD || '4.50');

let cache: AssistCache<JevAssist> = createAssistCache();
let spentTokens = 0;

function enabled(): boolean {
  return process.env.JEV_AI_ENABLED === 'true';
}

function safeId(index: number): string {
  return `candidate_${index}`;
}

async function hash(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function resetJevState(): void {
  cache.clear();
  spentTokens = 0;
}

function readResponse(data: unknown): JevResponse {
  if (!data || typeof data !== 'object') return {};
  return data as JevResponse;
}

export async function assistWithJev(product: string, candidates: Candidate[], fetcher: FetchLike = fetch): Promise<JevAssist> {
  if (!enabled()) return {status: 'off'};
  const key = process.env.JEV_API_KEY;
  if (!key) return {status: 'temporarily_unavailable', reason: 'missing_key'};
  const shortlist = candidates.slice(0, 12);
  if (!shortlist.length) return {status: 'inconclusive', reason: 'no_candidates'};

  const promptVersion = 'hts-v1';
  const cacheKey = await hash(JSON.stringify({promptVersion, product: product.trim().toLowerCase(), shortlist, model: JEV_MODEL}));
  const prior = cache.get(cacheKey);
  if (prior) return prior.status === 'ok' ? {...prior, status: 'cached'} : prior;
  if (spentTokens * PRICE_PER_TOKEN >= BUDGET_USD) return {status: 'budget_exhausted'};

  const state = {
    product: product.slice(0, 500),
    candidates: shortlist.map((candidate, index) => ({
      id: safeId(index),
      official_description: candidate.description,
      hierarchy: candidate.hierarchyParts,
    })),
  };
  const criteria = Object.fromEntries(
    shortlist.map((candidate, index) => [safeId(index), `${candidate.description}. Hierarchy: ${candidate.hierarchyParts}`]),
  );
  criteria.none_of_these = 'The supplied product facts do not support any candidate.';
  const questions: JevQuestions = {
    best_candidate: {
      type: 'choice',
      instructions: 'Which one candidate is the closest semantic fit for the supplied product facts? Pick none_of_these when the facts do not support any candidate.',
      criteria,
    },
    facts_sufficient: {
      type: 'noul',
      instructions: 'Are the supplied product facts sufficient to distinguish among this exact candidate list?',
      criteria: {
        true: 'Enough material, use, construction, and other distinguishing facts are supplied.',
        false: 'Important facts are missing or several candidates remain plausible.',
      },
    },
  };
  shortlist.forEach((candidate, index) => {
    questions[`fit_${index}`] = {
      type: 'noul',
      instructions: `Are the supplied product facts consistent with candidate ${safeId(index)}: ${candidate.description}?`,
      criteria: {
        true: 'Facts fit the official description without contradiction.',
        false: 'Facts conflict with it or are too incomplete to support it.',
      },
    };
  });

  const body = JSON.stringify({state, model: JEV_MODEL, questions});
  if (Math.ceil(body.length / 4) > MAX_INPUT_TOKENS) return {status: 'inconclusive', reason: 'request_too_large'};

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    let res: Response | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetcher('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
        body,
        signal: controller.signal,
      });
      if (![429, 529].includes(res.status) || attempt === 1) break;
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 150));
    }
    clearTimeout(timer);
    if (!res?.ok) return {status: res?.status === 402 ? 'budget_exhausted' : 'temporarily_unavailable', reason: `http_${res?.status || 0}`};

    const data = readResponse(await res.json());
    const tokens = Number(data.usage?.input_tokens || 0);
    spentTokens += tokens;
    const choice = data.answers?.best_candidate;
    const factsSufficient = Number(data.answers?.facts_sufficient?.noul);
    const selected = String(choice?.choice || '');
    const match = /^candidate_(\d+)$/.exec(selected);
    const confidence = Number(choice?.confidence);
    const fits = Object.fromEntries(shortlist.map((candidate, index) => [candidate.hts, Number(data.answers?.[`fit_${index}`]?.noul)]));
    let value: JevAssist = {
      status: 'inconclusive',
      model: String(data.model || JEV_MODEL),
      confidence,
      factsSufficient,
      fits,
      inputTokens: tokens,
      estimatedCostUsd: Number((tokens * PRICE_PER_TOKEN).toFixed(8)),
    };
    const selectedRow = match ? shortlist[Number(match[1])] : undefined;
    if (selectedRow && factsSufficient >= 0.65 && (fits[selectedRow.hts] ?? 0) >= 0.60) {
      value = {...value, status: 'ok', selectedHts: selectedRow.hts};
    }
    cache.set(cacheKey, value, CACHE_TTL_MS);
    return value;
  } catch (error) {
    return {status: 'temporarily_unavailable', reason: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network_error'};
  }
}

export function reorderWithAssist<T extends {hts: string; score?: number}>(items: T[], assist: JevAssist): T[] {
  // Jev fit is the primary rank whenever scores exist (ok, cached, or inconclusive); lexical score breaks ties.
  // This permutes the retrieved shortlist only — it never inserts a new HTS code.
  if (!assist.fits) return items;
  return [...items].sort((a, b) => (assist.fits?.[b.hts] ?? 0) - (assist.fits?.[a.hts] ?? 0) || (b.score ?? 0) - (a.score ?? 0));
}
