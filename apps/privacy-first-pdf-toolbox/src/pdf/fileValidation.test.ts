import { describe, expect, it } from 'vitest';
import { validateFiles } from './fileValidation';

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('validateFiles', () => {
  it('accepts pdf and image files under the size limit', () => {
    const result = validateFiles([
      makeFile('doc.pdf', 'application/pdf'),
      makeFile('scan.png', 'image/png'),
      makeFile('photo.jpg', 'image/jpeg')
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects unsupported file types', () => {
    const result = validateFiles([makeFile('notes.txt', 'text/plain')]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('notes.txt is not a supported file type.');
  });

  it('rejects files larger than 25 MB', () => {
    const result = validateFiles([makeFile('large.pdf', 'application/pdf', 26 * 1024 * 1024)]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('large.pdf is larger than 25 MB.');
  });
});
