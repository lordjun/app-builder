export function parsePageOrder(input: string, totalPages: number): number[] {
  const selectedPages: number[] = [];
  const seenPages = new Set<number>();
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    throw new Error('Enter the new page order, such as 3,1,2.');
  }

  for (const rawPart of trimmedInput.split(',')) {
    const part = rawPart.trim();
    if (part.length === 0) {
      throw new Error('Enter the new page order, such as 3,1,2.');
    }

    const rangeMatch = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!rangeMatch) {
      throw new Error('Use page numbers or ranges such as 3,1-2,4.');
    }

    const start = Number(rangeMatch[1]);
    const end = rangeMatch[2] ? Number(rangeMatch[2]) : start;

    if (start < 1 || end < 1) {
      throw new Error('Page numbers start at 1.');
    }

    if (start > end) {
      throw new Error('Ranges must go from low page to high page.');
    }

    for (let page = start; page <= end; page += 1) {
      if (page > totalPages) {
        throw new Error(`Page ${page} is outside this ${totalPages}-page PDF.`);
      }

      if (seenPages.has(page)) {
        throw new Error(`Page ${page} appears more than once.`);
      }

      seenPages.add(page);
      selectedPages.push(page - 1);
    }
  }

  if (selectedPages.length !== totalPages) {
    throw new Error('Include every page exactly once.');
  }

  return selectedPages;
}
