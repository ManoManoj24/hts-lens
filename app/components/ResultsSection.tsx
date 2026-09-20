import type {JevAssist} from '../../lib/jev';
import type {SearchResult} from '../../lib/types';

function assistMessage(assist: JevAssist, loading: boolean): string {
  if (loading) return 'Comparing the retrieved HTS candidates...';
  if (assist.status === 'ok') return 'AI Assist reordered these source-backed candidates.';
  if (assist.status === 'inconclusive') {
    return assist.fits
      ? 'No clear winner was picked. Fit scores are listed on each candidate — add product details to rank more confidently.'
      : 'No clear fit - add product details.';
  }
  if (assist.status === 'cached') return 'AI-assisted ranking from cache.';
  if (assist.status === 'off') return 'AI Assist is disabled for this preview.';
  return 'AI Assist unavailable - showing source-backed search results.';
}

type ResultsSectionProps = {
  q: string;
  ai: boolean;
  loading: boolean;
  error: string | null;
  results: SearchResult[];
  aiAssist: JevAssist;
  onExport: (kind: 'json' | 'md') => void;
  onCopy: (result: SearchResult) => void;
};

export function ResultsSection(props: ResultsSectionProps) {
  const {q, ai, loading, error, results, aiAssist} = props;
  return (
    <section className="results">
      {ai && <div className={`ai-status ${aiAssist.status}`}>{assistMessage(aiAssist, loading)}</div>}
      {error && <div className="ai-status temporarily_unavailable">{error}</div>}
      <div className="result-head">
        <div>
          <p className="eyebrow">Candidate lines</p>
          <h2>{results.length ? `Results for “${q}”` : 'No close lines found'}</h2>
        </div>
        <div className="exports">
          <button type="button" onClick={() => props.onExport('json')}>Export JSON</button>
          <button type="button" onClick={() => props.onExport('md')}>Export Markdown</button>
        </div>
      </div>
      {results.map((result, index) => (
        <article key={`${result.hts}-${index}`}>
          <div className="rank">{index + 1}</div>
          <div className="code">
            <strong><a href={`/hts/${encodeURIComponent(result.hts)}`}>{result.hts}</a></strong>
            <span>{result.label}</span>
            {typeof result.aiFit === 'number' && <span className="ai-fit">AI fit: {result.aiFit.toFixed(2)}</span>}
          </div>
          <div className="detail">
            <h3>{result.description}</h3>
            <p className="path">{result.hierarchyParts}</p>
            <dl>
              <div><dt>General duty</dt><dd>{result.general}</dd></div>
              <div><dt>Special</dt><dd>{result.special || 'No special rate listed'}</dd></div>
              <div><dt>Column 2</dt><dd>{result.column2 || 'Not listed'}</dd></div>
              <div><dt>Unit</dt><dd>{result.unit || 'Not specified'}</dd></div>
            </dl>
            {result.additional && <p className="note">Additional duties: {result.additional}</p>}
            <div className="actions">
              <button type="button" onClick={() => props.onCopy(result)}>Copy line</button>
              <a href={result.source}>USITC ↗</a>
              <a href={result.cross}>CBP CROSS ↗</a>
              <a href={`/hts/${encodeURIComponent(result.hts)}`}>Share ↗</a>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
