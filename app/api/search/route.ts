import {NextRequest, NextResponse} from 'next/server';
import {getProvenance} from '../../../lib/provenance';
import {parseSearchParams} from '../../../lib/search/params';
import {searchWithOptionalAssist} from '../../../lib/search';

export async function GET(req: NextRequest) {
  const query = parseSearchParams(req.nextUrl.searchParams);
  const provenance = getProvenance();
  const meta = {
    revision: provenance.revision,
    revisionNumber: provenance.revisionNumber,
    publishedDate: provenance.publishedDate,
    lastSynced: provenance.lastSynced,
    source: provenance.source,
  };
  if (query.q.length < 2) {
    return NextResponse.json({query: query.q, ...meta, results: []});
  }
  const {results, aiAssist} = await searchWithOptionalAssist(query);
  return NextResponse.json({
    query: query.q,
    filters: {
      commercial: query.commercial,
      exclude99: query.exclude99,
      statistical: query.statistical,
      family: query.family,
      strictFamily: query.strictFamily,
    },
    ...meta,
    retrievedAt: new Date().toISOString(),
    results,
    aiAssist,
  });
}
