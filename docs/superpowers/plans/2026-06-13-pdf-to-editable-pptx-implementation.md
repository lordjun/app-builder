# PDF to Editable PPTX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `Edit PDF` tool that converts one PDF into an editable `.pptx` file users can revise in PowerPoint, Keynote, or WPS and export back to PDF.

**Architecture:** Extend the existing tool registry with a seventh tool and keep all conversion work in lazy-loaded PDF modules. Add a focused `pdfToPptx` module that uses PDF.js for page rendering/text extraction and PptxGenJS for PPTX creation, then reuse the current save flow with a generalized output save helper.

**Tech Stack:** React, TypeScript, Vitest, pdf-lib, PDF.js via `pdfjs-dist`, PptxGenJS via `pptxgenjs`, Vite lazy chunks.

---

### Task 1: Install Conversion Dependencies

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/package.json`
- Modify: `apps/privacy-first-pdf-toolbox/package-lock.json`

- [ ] **Step 1: Install dependencies**

Run from `apps/privacy-first-pdf-toolbox`:

```powershell
$env:PATH='C:\Users\Lordjun\Documents\APP制作\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd install pdfjs-dist pptxgenjs
```

Expected: `package.json` contains `pdfjs-dist` and `pptxgenjs`; `package-lock.json` updates.

- [ ] **Step 2: Confirm package scripts still work**

Run:

```powershell
npm.cmd test -- src/pdf/lazyPdfModules.test.ts
```

Expected: existing lazy module test still passes before feature code changes.

### Task 2: Add App-Level Failing Tests

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/App.test.tsx`

- [ ] **Step 1: Mock the new converter**

Add near the other PDF module mocks:

```ts
import { convertPdfToEditablePptx } from './pdf/pdfToPptx';

vi.mock('./pdf/pdfToPptx', () => ({
  convertPdfToEditablePptx: vi.fn(async () => ({
    bytes: new Uint8Array([21, 22, 23]),
    extractedTextItemCount: 3,
    pageCount: 2,
  })),
}));
```

- [ ] **Step 2: Add failing routing and copy tests**

Add expectations that:

```ts
expect(screen.getByRole('button', { name: 'Edit PDF' })).toBeInTheDocument();
expect(screen.getByText('Convert PDF to editable PowerPoint.')).toBeInTheDocument();
```

Add a tool-specific requirement check:

```ts
fireEvent.click(screen.getByRole('button', { name: 'Edit PDF' }));
expect(screen.getByText('Choose one PDF. The app will create a PPTX you can edit in PowerPoint, Keynote, or WPS.')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Start processing' })).toHaveTextContent('Create editable PPTX');
```

- [ ] **Step 3: Add failing processing tests**

Add tests that select one PDF, click `Start processing`, and expect:

```ts
await waitFor(() => expect(convertPdfToEditablePptx).toHaveBeenCalledWith(source));
expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([21, 22, 23]), 'editable-pdf.pptx');
expect(await screen.findByText(/Created editable PowerPoint from 2 pages/i)).toBeInTheDocument();
expect(screen.getByText(/Export from PowerPoint to PDF after editing/i)).toBeInTheDocument();
```

Add a no-text warning test by mocking `extractedTextItemCount: 0`.

- [ ] **Step 4: Verify RED**

Run:

```powershell
npm.cmd test -- src/App.test.tsx
```

Expected: fails because `pdfToPptx` and `Edit PDF` do not exist.

### Task 3: Generalize Output Save Flow for PPTX

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/App.tsx`

- [ ] **Step 1: Add minimal output metadata**

Add an output kind type:

```ts
type OutputKind = 'pdf' | 'pptx';
```

Change `saveOutput(bytes, filename)` to `saveOutput(bytes, filename, outputKind = 'pdf')`.

- [ ] **Step 2: Preserve existing PDF behavior**

Use MIME:

```ts
const mimeType = outputKind === 'pptx'
  ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  : 'application/pdf';
```

For Downloads, continue using `downloadPdf(bytes, normalizedFilename)` because the helper downloads arbitrary bytes despite its name.

For selected-folder writes, use the chosen `mimeType` in the `Blob`.

- [ ] **Step 3: Verify no regressions**

Run:

```powershell
npm.cmd test -- src/App.test.tsx
```

Expected: existing tests pass or only fail for missing `Edit PDF` feature.

### Task 4: Add Edit PDF Tool Shell

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/App.tsx`

- [ ] **Step 1: Extend tool types and defaults**

Change:

```ts
type Tool = 'images' | 'merge' | 'split' | 'reorder' | 'optimize' | 'edit' | 'sign';
```

Add:

```ts
edit: 'editable-pdf.pptx',
```

- [ ] **Step 2: Add tool input configuration**

Add:

```ts
edit: {
  accept: 'application/pdf',
  cardDescription: 'Convert PDF to editable PowerPoint.',
  cardLabel: 'Edit PDF',
  category: 'Convert',
  dropZoneLabel: 'PDF to PowerPoint upload drop zone',
  icon: 'PPT',
  multiple: false,
  requirement: 'Choose one PDF. The app will create a PPTX you can edit in PowerPoint, Keynote, or WPS.',
  selectLabel: 'Select PDF',
},
```

Update category union and `TOOL_CATEGORIES` to include `Convert`.

- [ ] **Step 3: Add validation and action label**

Update `getSelectedFileProblem` to require one PDF for `edit`.

Update `getPrimaryActionLabel`:

```ts
if (tool === 'edit') {
  return 'Create editable PPTX';
}
```

- [ ] **Step 4: Add runner**

Add a `runEdit(files)` branch before `runSign`.

Implementation:

```ts
async function runEdit(files: File[]) {
  await runSafely(async () => {
    const validation = validateFiles(files);
    if (!validation.valid) {
      setValidationErrorMessage(validation.errors);
      return;
    }

    const [pdfFile] = files.filter((file) => file.type === 'application/pdf');
    if (!pdfFile) {
      setMessage('Choose one PDF to convert to PowerPoint.');
      return;
    }

    const { convertPdfToEditablePptx } = await import('./pdf/pdfToPptx');
    const result = await convertPdfToEditablePptx(pdfFile);
    const saveResult = await saveOutput(result.bytes, DEFAULT_OUTPUT_FILENAMES.edit, 'pptx');
    setCompletedMessage(getEditablePptxSummary(result.pageCount, result.extractedTextItemCount), saveResult);
  });
}
```

Add `getEditablePptxSummary`.

- [ ] **Step 5: Verify GREEN for app tests**

Run:

```powershell
npm.cmd test -- src/App.test.tsx
```

Expected: app tests pass once module stub exists.

### Task 5: Add Converter Module Tests

**Files:**
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/pdfToPptx.test.ts`
- Create: `apps/privacy-first-pdf-toolbox/src/pdf/pdfToPptx.ts`

- [ ] **Step 1: Write failing converter tests**

Use `pdf-lib` to create a simple PDF in the test, then call:

```ts
const result = await convertPdfToEditablePptx(file);
expect(result.pageCount).toBe(1);
expect(result.bytes.length).toBeGreaterThan(0);
expect(result.extractedTextItemCount).toBeGreaterThan(0);
expect(new TextDecoder('latin1').decode(result.bytes.slice(0, 2))).toBe('PK');
```

Also test image-only/blank PDF returns `extractedTextItemCount` of `0` and still emits PPTX bytes.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm.cmd test -- src/pdf/pdfToPptx.test.ts
```

Expected: fails because `convertPdfToEditablePptx` is not implemented.

- [ ] **Step 3: Implement converter**

Implement `convertPdfToEditablePptx` with PDF.js and PptxGenJS:

- read file bytes into `Uint8Array`;
- load with `pdfjsLib.getDocument({ data })`;
- for each page, read viewport and text content;
- create one PPTX slide per page;
- add extracted text boxes where possible;
- return `Uint8Array` bytes from PPTX generation.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm.cmd test -- src/pdf/pdfToPptx.test.ts
```

Expected: converter tests pass.

### Task 6: Update Docs and Release Checklist

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/README.md`
- Modify: `docs/release/privacy-first-pdf-toolbox-checklist.md`
- Modify: `docs/product/privacy-first-pdf-toolbox-post-launch-validation.md`

- [ ] **Step 1: Add Current MVP docs**

Add an `Edit PDF` bullet explaining the PPTX export workflow and limitations.

- [ ] **Step 2: Add release checklist items**

Add manual checks:

- select `numbered-4-pages.pdf`;
- click `Create editable PPTX`;
- open `.pptx`;
- confirm slide count and editable extracted text;
- confirm image-only warning when text cannot be extracted.

- [ ] **Step 3: Add post-launch validation item**

Add feedback question: whether users understand the PPTX edit/export-back workflow.

### Task 7: Full Verification and Commit

**Files:**
- All changed feature files.

- [ ] **Step 1: Run full test suite**

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```powershell
npm.cmd run build
```

Expected: TypeScript and Vite build pass; conversion code should be emitted as lazy chunks.

- [ ] **Step 3: Inspect diff**

```powershell
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' diff --stat
```

- [ ] **Step 4: Commit**

```powershell
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' add apps/privacy-first-pdf-toolbox docs
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' commit -m "Add PDF to editable PPTX tool"
```

Do not push.

---

## Self-Review

Spec coverage:

- `Edit PDF` tool routing: Task 4.
- Browser-local conversion: Task 5.
- PPTX output and save flow: Tasks 3-5.
- Honest warnings and limitations: Tasks 4 and 6.
- Tests: Tasks 2, 5, and 7.

No placeholders remain. The plan intentionally excludes OCR, Word export, server-side conversion, and in-browser PPTX-to-PDF conversion.
