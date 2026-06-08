const SUPPORTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateFiles(files: File[]): ValidationResult {
  const errors: string[] = [];

  for (const file of files) {
    if (!SUPPORTED_TYPES.has(file.type)) {
      errors.push(`${file.name} is not a supported file type.`);
    }

    if (file.size > MAX_SIZE_BYTES) {
      errors.push(`${file.name} is larger than 25 MB.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
