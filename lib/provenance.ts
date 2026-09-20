import manifest from '../data/manifest.json' with {type: 'json'};
import type {Provenance} from './types.ts';

export function formatSyncLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
}

export function getProvenance(): Provenance {
  return {
    revision: manifest.revision,
    revisionNumber: manifest.revisionNumber,
    publishedDate: manifest.publishedDate,
    lastSynced: manifest.syncedAt,
    lastSyncedLabel: formatSyncLabel(manifest.syncedAt),
    source: manifest.sourcePage,
    sourceCsv: manifest.sourceCsv,
  };
}
