const UNSAFE_FILENAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f]+/g;

export function normalizePdfFilename(input: string, defaultFilename: string): string {
  const fallback = ensurePdfExtension(defaultFilename.trim() || 'document.pdf');
  const sanitized = input.trim().replace(UNSAFE_FILENAME_CHARACTERS, '-').replace(/\s+/g, ' ');

  if (!sanitized) {
    return fallback;
  }

  return ensurePdfExtension(sanitized);
}

function ensurePdfExtension(filename: string): string {
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
}
