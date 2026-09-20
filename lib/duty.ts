/** Official HTS duty cells are often blank on headings and statistical suffixes. Blank is not Free. */
export function publishedDuty(value: string | undefined | null): string {
  const text = value?.trim() ?? '';
  return text || 'Not listed';
}
