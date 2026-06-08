# Privacy-First PDF Toolbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Web/PWA prototype that lets users create PDFs from images, merge PDFs, and add a simple signature locally in the browser.

**Architecture:** Create a Vite + React + TypeScript app under `apps/privacy-first-pdf-toolbox`. Keep PDF behavior in small service modules under `src/pdf/`, UI state in React components under `src/components/`, and tests next to the service modules. All file processing stays client-side with `pdf-lib`; no backend is introduced.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, pdf-lib, browser File API.

---

## File Structure

- Create: `apps/privacy-first-pdf-toolbox/package.json`
- Create: `apps/privacy-first-pdf-toolbox/index.html`
- Create: `apps/privacy-first-pdf-toolbox/vite.config.ts`
- Create: `apps/privacy-first-pdf-toolbox/tsconfig.json`
- Create: `apps/privacy-first-pdf-toolbox/src/main.tsx`
- Create: `apps/privacy-first-pdf-toolbox/src/App.tsx`
- Create: `apps/privacy-first-pdf-toolbox/src/App.test.tsx`
- Create: `apps/privacy-first-pdf-toolbox/src/styles.css`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/imageToPdf.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/imageToPdf.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/mergePdfs.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/mergePdfs.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/signPdf.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/signPdf.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/download.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/fileValidation.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/fileValidation.test.ts`

## Task 1: Scaffold The Vite React App

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/package.json`
- Create: `apps/privacy-first-pdf-toolbox/index.html`
- Create: `apps/privacy-first-pdf-toolbox/vite.config.ts`
- Create: `apps/privacy-first-pdf-toolbox/tsconfig.json`
- Create: `apps/privacy-first-pdf-toolbox/src/main.tsx`
- Create: `apps/privacy-first-pdf-toolbox/src/App.tsx`
- Create: `apps/privacy-first-pdf-toolbox/src/styles.css`

- [ ] **Step 1: Create package metadata**

```json
{
  "name": "privacy-first-pdf-toolbox",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "pdf-lib": "^1.17.1",
    "vite": "^6.0.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite config**

`apps/privacy-first-pdf-toolbox/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

`apps/privacy-first-pdf-toolbox/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
});
```

- [ ] **Step 3: Create HTML and React entry**

`apps/privacy-first-pdf-toolbox/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Privacy PDF Toolbox</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`apps/privacy-first-pdf-toolbox/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Create initial App shell**

`apps/privacy-first-pdf-toolbox/src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <p className="eyebrow">Local-first document tools</p>
        <h1 id="app-title">Privacy PDF Toolbox</h1>
        <p className="lede">Create, merge, and sign PDFs in your browser. Files stay local by default.</p>
      </section>

      <section className="tool-grid" aria-label="PDF tools">
        <button className="tool-card" type="button">Images to PDF</button>
        <button className="tool-card" type="button">Merge PDFs</button>
        <button className="tool-card" type="button">Sign PDF</button>
      </section>
    </main>
  );
}
```

`apps/privacy-first-pdf-toolbox/src/styles.css`:

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172026;
  background: #f7f8fb;
}

body {
  margin: 0;
}

button,
input {
  font: inherit;
}

.app-shell {
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.hero-panel {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #2f6f5e;
  font-size: 0.9rem;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.15;
}

.lede {
  max-width: 680px;
  color: #50616d;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.tool-card {
  min-height: 112px;
  border: 1px solid #dce3e8;
  border-radius: 8px;
  background: #ffffff;
  color: #172026;
  font-weight: 700;
  cursor: pointer;
}

.tool-card:hover {
  border-color: #2f6f5e;
}

@media (max-width: 720px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Install dependencies and verify scaffold**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm install
npm run build
```

Expected:

- `npm install` exits 0.
- `npm run build` exits 0 and writes `dist/`.

## Task 2: Add File Validation With TDD

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/fileValidation.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/fileValidation.ts`

- [ ] **Step 1: Write failing validation tests**

`apps/privacy-first-pdf-toolbox/src/pdf/fileValidation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/fileValidation.test.ts
```

Expected: FAIL because `./fileValidation` does not exist.

- [ ] **Step 3: Implement file validation**

`apps/privacy-first-pdf-toolbox/src/pdf/fileValidation.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/fileValidation.test.ts
```

Expected: PASS.

## Task 3: Add Images-To-PDF Service With TDD

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/imageToPdf.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/imageToPdf.ts`

- [ ] **Step 1: Write failing image conversion test**

`apps/privacy-first-pdf-toolbox/src/pdf/imageToPdf.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { createPdfFromImages } from './imageToPdf';

const onePixelPng = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 15, 4, 0,
  9, 251, 3, 253, 167, 181, 196, 199, 0, 0, 0, 0, 73, 69, 78, 68,
  174, 66, 96, 130
]);

describe('createPdfFromImages', () => {
  it('creates one PDF page per image', async () => {
    const pdfBytes = await createPdfFromImages([
      new File([onePixelPng], 'one.png', { type: 'image/png' }),
      new File([onePixelPng], 'two.png', { type: 'image/png' })
    ]);

    const pdf = await PDFDocument.load(pdfBytes);
    expect(pdf.getPageCount()).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/imageToPdf.test.ts
```

Expected: FAIL because `./imageToPdf` does not exist.

- [ ] **Step 3: Implement image conversion**

`apps/privacy-first-pdf-toolbox/src/pdf/imageToPdf.ts`:

```ts
import { PDFDocument } from 'pdf-lib';

export async function createPdfFromImages(files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = file.type === 'image/png'
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
  }

  return pdf.save();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/imageToPdf.test.ts
```

Expected: PASS.

## Task 4: Add PDF Merge Service With TDD

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/mergePdfs.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/mergePdfs.ts`

- [ ] **Step 1: Write failing merge test**

`apps/privacy-first-pdf-toolbox/src/pdf/mergePdfs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from './mergePdfs';

async function makePdfFile(name: string, pages: number): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) {
    pdf.addPage([200, 200]);
  }
  const bytes = await pdf.save();
  return new File([bytes], name, { type: 'application/pdf' });
}

describe('mergePdfs', () => {
  it('preserves input page order and count', async () => {
    const mergedBytes = await mergePdfs([
      await makePdfFile('one.pdf', 1),
      await makePdfFile('two.pdf', 2)
    ]);

    const merged = await PDFDocument.load(mergedBytes);
    expect(merged.getPageCount()).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/mergePdfs.test.ts
```

Expected: FAIL because `./mergePdfs` does not exist.

- [ ] **Step 3: Implement PDF merge**

`apps/privacy-first-pdf-toolbox/src/pdf/mergePdfs.ts`:

```ts
import { PDFDocument } from 'pdf-lib';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const output = await PDFDocument.create();

  for (const file of files) {
    const input = await PDFDocument.load(await file.arrayBuffer());
    const pages = await output.copyPages(input, input.getPageIndices());
    for (const page of pages) {
      output.addPage(page);
    }
  }

  return output.save();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/mergePdfs.test.ts
```

Expected: PASS.

## Task 5: Add Simple Signature Service With TDD

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/signPdf.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/signPdf.ts`

- [ ] **Step 1: Write failing signature test**

`apps/privacy-first-pdf-toolbox/src/pdf/signPdf.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { signPdf } from './signPdf';

async function makePdfFile(): Promise<File> {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 400]);
  const bytes = await pdf.save();
  return new File([bytes], 'unsigned.pdf', { type: 'application/pdf' });
}

describe('signPdf', () => {
  it('returns a valid PDF with the original page count', async () => {
    const signedBytes = await signPdf(await makePdfFile(), 'Jane Doe');

    const signed = await PDFDocument.load(signedBytes);
    expect(signed.getPageCount()).toBe(1);
  });

  it('rejects blank signatures', async () => {
    await expect(signPdf(await makePdfFile(), '   ')).rejects.toThrow('Signature text is required.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/signPdf.test.ts
```

Expected: FAIL because `./signPdf` does not exist.

- [ ] **Step 3: Implement simple text signature**

`apps/privacy-first-pdf-toolbox/src/pdf/signPdf.ts`:

```ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function signPdf(file: File, signatureText: string): Promise<Uint8Array> {
  const trimmed = signatureText.trim();
  if (!trimmed) {
    throw new Error('Signature text is required.');
  }

  const pdf = await PDFDocument.load(await file.arrayBuffer());
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const firstPage = pdf.getPage(0);
  const { width } = firstPage.getSize();

  firstPage.drawText(trimmed, {
    x: Math.max(36, width - 180),
    y: 48,
    size: 18,
    font,
    color: rgb(0.05, 0.12, 0.16)
  });

  return pdf.save();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/pdf/signPdf.test.ts
```

Expected: PASS.

## Task 6: Add Download Helper

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/download.ts`

- [ ] **Step 1: Implement browser download helper**

`apps/privacy-first-pdf-toolbox/src/pdf/download.ts`:

```ts
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Run full tests**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test
```

Expected: all tests pass.

## Task 7: Build The Tool UI

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/App.tsx`
- Modify: `apps/privacy-first-pdf-toolbox/src/styles.css`

- [ ] **Step 1: Replace App shell with working UI**

`apps/privacy-first-pdf-toolbox/src/App.tsx`:

```tsx
import { useState } from 'react';
import { downloadPdf } from './pdf/download';
import { validateFiles } from './pdf/fileValidation';
import { createPdfFromImages } from './pdf/imageToPdf';
import { mergePdfs } from './pdf/mergePdfs';
import { signPdf } from './pdf/signPdf';

type Tool = 'images' | 'merge' | 'sign';

export default function App() {
  const [tool, setTool] = useState<Tool>('images');
  const [message, setMessage] = useState('Choose a tool to start.');
  const [signature, setSignature] = useState('');

  async function runImages(files: FileList | null) {
    const selected = Array.from(files ?? []);
    const validation = validateFiles(selected);
    if (!validation.valid) {
      setMessage(validation.errors.join(' '));
      return;
    }

    const imageFiles = selected.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setMessage('Choose at least one image.');
      return;
    }

    const bytes = await createPdfFromImages(imageFiles);
    downloadPdf(bytes, 'images-to-pdf.pdf');
    setMessage(`Created PDF from ${imageFiles.length} image file${imageFiles.length === 1 ? '' : 's'}.`);
  }

  async function runMerge(files: FileList | null) {
    const selected = Array.from(files ?? []);
    const validation = validateFiles(selected);
    if (!validation.valid) {
      setMessage(validation.errors.join(' '));
      return;
    }

    const pdfFiles = selected.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length < 2) {
      setMessage('Choose at least two PDFs to merge.');
      return;
    }

    const bytes = await mergePdfs(pdfFiles);
    downloadPdf(bytes, 'merged.pdf');
    setMessage(`Merged ${pdfFiles.length} PDF files.`);
  }

  async function runSign(files: FileList | null) {
    const selected = Array.from(files ?? []);
    const validation = validateFiles(selected);
    if (!validation.valid) {
      setMessage(validation.errors.join(' '));
      return;
    }

    const [pdfFile] = selected.filter((file) => file.type === 'application/pdf');
    if (!pdfFile) {
      setMessage('Choose one PDF to sign.');
      return;
    }

    const bytes = await signPdf(pdfFile, signature);
    downloadPdf(bytes, 'signed.pdf');
    setMessage('Signed the PDF on the first page.');
  }

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <p className="eyebrow">Local-first document tools</p>
        <h1 id="app-title">Privacy PDF Toolbox</h1>
        <p className="lede">Create, merge, and sign PDFs in your browser. Files stay local by default.</p>
      </section>

      <section className="tool-grid" aria-label="PDF tools">
        <button className={tool === 'images' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => setTool('images')}>Images to PDF</button>
        <button className={tool === 'merge' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => setTool('merge')}>Merge PDFs</button>
        <button className={tool === 'sign' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => setTool('sign')}>Sign PDF</button>
      </section>

      <section className="workspace" aria-live="polite">
        <p className="privacy-note">Processed locally in your browser. No upload step is used.</p>
        {tool === 'images' && (
          <label className="file-picker">
            Select images
            <input type="file" accept="image/png,image/jpeg" multiple onChange={(event) => void runImages(event.currentTarget.files)} />
          </label>
        )}
        {tool === 'merge' && (
          <label className="file-picker">
            Select PDFs
            <input type="file" accept="application/pdf" multiple onChange={(event) => void runMerge(event.currentTarget.files)} />
          </label>
        )}
        {tool === 'sign' && (
          <div className="signing-panel">
            <label>
              Signature text
              <input value={signature} onChange={(event) => setSignature(event.target.value)} aria-label="Signature text" />
            </label>
            <label className="file-picker">
              Select PDF
              <input type="file" accept="application/pdf" onChange={(event) => void runSign(event.currentTarget.files)} />
            </label>
          </div>
        )}
        <p className="status">{message}</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Add workspace styles**

Append to `apps/privacy-first-pdf-toolbox/src/styles.css`:

```css
.active {
  border-color: #2f6f5e;
  box-shadow: 0 0 0 3px rgba(47, 111, 94, 0.14);
}

.workspace {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #dce3e8;
  border-radius: 8px;
  background: #ffffff;
}

.privacy-note {
  margin-top: 0;
  color: #2f6f5e;
  font-weight: 700;
}

.file-picker {
  display: grid;
  gap: 10px;
  max-width: 420px;
  font-weight: 700;
}

.file-picker input,
.signing-panel input {
  width: 100%;
  box-sizing: border-box;
}

.signing-panel {
  display: grid;
  gap: 16px;
  max-width: 420px;
}

.signing-panel label {
  display: grid;
  gap: 10px;
  font-weight: 700;
}

.status {
  margin-bottom: 0;
  color: #50616d;
}
```

- [ ] **Step 3: Build**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm run build
```

Expected: build exits 0.

## Task 8: Add UI Smoke Test

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/App.test.tsx`

- [ ] **Step 1: Write UI smoke test**

`apps/privacy-first-pdf-toolbox/src/App.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the product name, privacy promise, and three tool entries', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Privacy PDF Toolbox' })).toBeInTheDocument();
    expect(screen.getByText(/Files stay local by default/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Images to PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDFs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign PDF' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI test**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test -- src/App.test.tsx
```

Expected: PASS.

## Task 9: Final Verification

**Files:**
- Verify all files created in `apps/privacy-first-pdf-toolbox`

- [ ] **Step 1: Run all tests**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm run build
```

Expected: build exits 0.

- [ ] **Step 3: Start local dev server**

Run:

```bash
cd apps/privacy-first-pdf-toolbox
npm run dev
```

Expected: Vite serves the app on `http://127.0.0.1:5173/` or another available port.

- [ ] **Step 4: Browser QA**

Use Browser to open the local URL and verify:

- Product title is visible.
- Three tool buttons are visible.
- Mobile viewport has no overlapping text.
- Privacy promise is visible.
- File inputs are reachable.

## Self-Review

- Spec coverage: the plan covers all Version 0.1 PRD scope items except hand-drawn signature. The PRD allows text signature simplification for Version 0.1.
- Incomplete marker scan: no unfinished markers or unspecified implementation steps are intentionally left.
- Type consistency: service names are `validateFiles`, `createPdfFromImages`, `mergePdfs`, `signPdf`, and `downloadPdf` consistently across tests and UI.
