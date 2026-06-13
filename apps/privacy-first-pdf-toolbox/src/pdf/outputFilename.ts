const UNSAFE_FILENAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f]+/g;

export function normalizePdfFilename(input: string, defaultFilename: string): string {
  return normalizeOutputFilename(input, defaultFilename, 'pdf');
}

export function normalizeOutputFilename(input: string, defaultFilename: string, extension: string): string {
  const normalizedExtension = extension.replace(/^\.+/, '').toLowerCase() || 'pdf';
  const fallback = ensureExtension(defaultFilename.trim() || `document.${normalizedExtension}`, normalizedExtension);
  const sanitized = input.trim().replace(UNSAFE_FILENAME_CHARACTERS, '-').replace(/\s+/g, ' ');

  if (!sanitized) {
    return fallback;
  }

  return ensureExtension(sanitized, normalizedExtension);
}

function ensureExtension(filename: string, extension: string): string {
  return filename.toLowerCase().endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
}
