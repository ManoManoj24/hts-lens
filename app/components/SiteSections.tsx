import type {Provenance} from '../../lib/types';

export function SiteHeader({revision}: {revision: string}) {
  return (
    <header>
      <a className="brand" href="/">HTS Lens</a>
      <span className="stamp">{revision}</span>
    </header>
  );
}

export function MethodSection() {
  return (
    <section className="method">
      <p className="eyebrow">A better classification path</p>
      <h2>Search is the start, not the ruling.</h2>
      <div className="method-grid">
        <div>
          <b>1</b>
          <h3>Describe the good</h3>
          <p>Material, principal use, construction and how it is sold matter more than a brand name.</p>
        </div>
        <div>
          <b>2</b>
          <h3>Compare candidates</h3>
          <p>Read the official hierarchy and notes. AI Assist may reorder the retrieved list, never create a code.</p>
        </div>
        <div>
          <b>3</b>
          <h3>Verify the treatment</h3>
          <p>Check the current USITC line, CROSS rulings, origin measures and Chapter 99 before relying on it.</p>
        </div>
      </div>
    </section>
  );
}

export function QuestionsSection() {
  const questions = [
    'What is it made of?',
    'What is its principal use?',
    'How is it manufactured?',
    'What are its dimensions or capacity?',
    'Does it use a power source?',
    'What is the country of origin?',
  ];
  return (
    <section className="questions">
      <p className="eyebrow">Before you rely on a code</p>
      <h2>Classification needs complete product facts.</h2>
      <div className="grid">
        {questions.map((question, index) => (
          <div key={question}>
            <span>0{index + 1}</span>
            <p>{question}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SiteFooter({provenance}: {provenance: Provenance}) {
  return (
    <footer>
      <p>
        <strong>Research boundary.</strong> Research estimates, not legal advice or a binding CBP ruling. Origin, date, Chapter 99 measures, and AD/CVD can change treatment.
      </p>
      <p>
        Source: <a href={provenance.source}>{provenance.revision}</a>, published {provenance.publishedDate}. <a href="/changelog">Changelog</a>
      </p>
    </footer>
  );
}
