import Link from 'next/link';
import records from '../../../data/hts.normalized.json';
import {publishedDuty} from '../../../lib/duty';
import {formatUnit} from '../../../lib/hts';
import {getProvenance} from '../../../lib/provenance';
import type {HtsRow} from '../../../lib/types';

function decodeCode(code: string): string {
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}

export default async function Code({params}: {params: Promise<{code: string}>}) {
  const {code} = await params;
  const wanted = decodeCode(code);
  const provenance = getProvenance();
  const row = (records as HtsRow[]).find(item => item.h === wanted);
  if (!row) {
    return (
      <main>
        <header><Link className="brand" href="/">HTS Lens</Link></header>
        <section className="hero"><h1>HTS line not found.</h1></section>
      </main>
    );
  }
  return (
    <main>
      <header>
        <Link className="brand" href="/">HTS Lens</Link>
        <span className="stamp">{provenance.revision}</span>
      </header>
      <section className="hero">
        <p className="eyebrow">Shareable HTS research record</p>
        <h1>{row.h}</h1>
        <p className="intro">{row.d}</p>
      </section>
      <section className="results">
        <article>
          <div className="detail">
            <h3>Hierarchy</h3>
            <p className="path">{row.p} &gt; {row.d}</p>
            <dl>
              <div><dt>General duty</dt><dd>{publishedDuty(row.g)}</dd></div>
              <div><dt>Special</dt><dd>{row.s || 'Not listed'}</dd></div>
              <div><dt>Column 2</dt><dd>{row.c || 'Not listed'}</dd></div>
              <div><dt>Unit</dt><dd>{formatUnit(row.u)}</dd></div>
            </dl>
            <a href={`https://hts.usitc.gov/search?query=${encodeURIComponent(row.h)}`}>Verify on USITC ↗</a>
          </div>
        </article>
      </section>
    </main>
  );
}
