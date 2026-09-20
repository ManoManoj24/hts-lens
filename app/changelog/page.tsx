import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import Link from 'next/link';

export default async function ChangelogPage() {
  const markdown = await readFile(join(process.cwd(), 'CHANGELOG.md'), 'utf8');
  return (
    <main>
      <header>
        <Link className="brand" href="/">HTS Lens</Link>
      </header>
      <section className="hero">
        <p className="eyebrow">Project history</p>
        <h1>Changelog</h1>
        <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14, lineHeight: 1.55, color: 'var(--ink)'}}>{markdown}</pre>
      </section>
    </main>
  );
}
