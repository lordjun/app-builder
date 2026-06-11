export function parsePageRanges(input: string, totalPages: number): number[] {
  const trimmedInput = input.trim();
  if (trimmedInput.length === 0) {
    throw new Error('Enter page ranges such as 1-3,5.');
  }

  const selectedPages = new Set<number>();
  for (const rawPart of trimmedInput.split(',')) {
    const part = rawPart.trim();
    if (part.length === 0) {
      throw new Error('Enter page ranges such as 1-3,5.');
    }

    const rangeMatch = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!rangeMatch) {
      throw new Error('Use page ranges such as 1-3,5.');
    }

    const start = Number(rangeMatch[1]);
    const end = rangeMatch[2] ? Number(rangeMatch[2]) : start;

    if (start < 1 || end < 1) {
      throw new Error('Page numbers start at 1.');
    }

    if (start > end) {
      throw new Error('Range start must be before range end.');
    }

    if (end > totalPages) {
      throw new Error(`Page ${end} is outside this ${totalPages}-page PDF.`);
    }

    for (let page = start; page <= end; page += 1) {
      selectedPages.add(page - 1);
    }
  }

  return [...selectedPages];
}
