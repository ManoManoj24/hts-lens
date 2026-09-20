'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {ResultsSection} from './components/ResultsSection';
import {SearchForm} from './components/SearchForm';
import {MethodSection, QuestionsSection, SiteFooter, SiteHeader} from './components/SiteSections';
import type {JevAssist} from '../lib/jev';
import {emptyFacts} from '../lib/facts';
import type {ProductFacts, ProductFamily, Provenance, SearchFilters, SearchResult} from '../lib/types';

type SearchResponse = {
  results?: SearchResult[];
  aiAssist?: JevAssist;
};

const DEFAULT_FILTERS: SearchFilters = {
  commercial: true,
  exclude99: true,
  statistical: false,
  family: 'all',
  strictFamily: false,
};

export function HomeClient({provenance}: {provenance: Provenance}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  const [family, setFamily] = useState<ProductFamily>('all');
  const [strictFamily, setStrictFamily] = useState(false);
  const [facts, setFacts] = useState<ProductFacts>(emptyFacts);
  const [aiAssist, setAiAssist] = useState<JevAssist>({status: 'off'});
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const abortRef = useRef<AbortController | null>(null);

  async function search(term = q) {
    if (term.trim().length < 2) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      q: term,
      ...(filters.commercial ? {commercial: '1'} : {}),
      ...(filters.exclude99 ? {exclude99: '1'} : {}),
      ...(filters.statistical ? {statistical: '1'} : {}),
      ...(family !== 'all' ? {family, ...(strictFamily ? {strictFamily: '1'} : {})} : {}),
      ...(ai ? {ai: '1', ...Object.fromEntries(Object.entries(facts).filter(([, value]) => value.trim()))} : {}),
    });
    try {
      const response = await fetch(`/api/search?${params}`, {signal: controller.signal});
      if (!response.ok) throw new Error(`http_${response.status}`);
      const data = (await response.json()) as SearchResponse;
      setResults(Array.isArray(data.results) ? data.results : []);
      setAiAssist(data.aiAssist ?? {status: 'off'});
      setSearched(true);
      history.replaceState({}, '', `/search?q=${encodeURIComponent(term)}`);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError('Search failed. Showing no results rather than a stale list.');
      setResults([]);
      setAiAssist({status: 'off'});
      setSearched(true);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  useEffect(() => {
    const initial = new URLSearchParams(location.search).get('q');
    if (!initial) return;
    setQ(initial);
    void search(initial);
    // Initial URL hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void search();
  }

  function example(value: string) {
    setQ(value);
    void search(value);
  }

  function copy(result: SearchResult) {
    void navigator.clipboard.writeText(`${result.hts} — ${result.description}\nGeneral duty: ${result.general}\n${result.source}`);
  }

  function exportResults(kind: 'json' | 'md') {
    const record = {
      query: q,
      revision: provenance.revision,
      published: provenance.publishedDate,
      lastSynced: provenance.lastSyncedLabel,
      results,
      disclaimer: 'Research estimate only. Not legal advice or a binding CBP ruling.',
    };
    const body = kind === 'json'
      ? JSON.stringify(record, null, 2)
      : `# HTS research: ${q}\n\n${provenance.revision}\n\n${results.map(result => `## ${result.hts} — ${result.description}\nGeneral duty: ${result.general}\n${result.source}`).join('\n\n')}`;
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([body], {type: kind === 'json' ? 'application/json' : 'text/markdown'}));
    anchor.download = `hts-research.${kind === 'json' ? 'json' : 'md'}`;
    anchor.click();
  }

  return (
    <main>
      <SiteHeader revision={provenance.revision} />
      <section className="hero">
        <p className="eyebrow">Official US tariff data. Zero guesswork.</p>
        <h1>Describe the product. Compare source-backed HTS candidates.</h1>
        <p className="intro">Use ordinary product words or paste an HTS number. We search the official USITC schedule, show the published duty text, and keep AI ranking separate from the source record.</p>
        <div className="sync">
          <strong>{provenance.revision}</strong>
          <span>Published {provenance.publishedDate}</span>
          <span>Last synced {provenance.lastSyncedLabel}</span>
        </div>
        <SearchForm
          q={q}
          loading={loading}
          ai={ai}
          family={family}
          strictFamily={strictFamily}
          facts={facts}
          filters={filters}
          onQueryChange={setQ}
          onSubmit={submit}
          onExample={example}
          onFamilyChange={value => {
            setFamily(value);
            if (value === 'all') setStrictFamily(false);
          }}
          onStrictFamilyChange={setStrictFamily}
          onFiltersChange={setFilters}
          onAiChange={setAi}
          onFactChange={(key, value) => setFacts(current => ({...current, [key]: value}))}
        />
      </section>
      {searched && (
        <ResultsSection
          q={q}
          ai={ai}
          loading={loading}
          error={error}
          results={results}
          aiAssist={aiAssist}
          onExport={exportResults}
          onCopy={copy}
        />
      )}
      <MethodSection />
      <QuestionsSection />
      <SiteFooter provenance={provenance} />
    </main>
  );
}
