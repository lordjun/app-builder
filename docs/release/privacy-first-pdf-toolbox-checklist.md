# Privacy PDF Toolbox Release Checklist

Use this checklist before manually pushing or publishing the Privacy PDF Toolbox MVP.

## Code State

- [ ] Confirm the working tree only contains intended changes.
- [ ] Confirm local commits are ready to push.
- [ ] Do not push from Codex unless the user explicitly reverses the current no-push instruction.

Suggested commands from the repository root:

```powershell
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' status -sb
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' log --oneline --max-count=10
```

## Automated Verification

Run from `apps/privacy-first-pdf-toolbox`:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd test
npm.cmd run build
```

Pass criteria:

- [ ] Vitest reports all test files passed.
- [ ] TypeScript compilation completes without errors.
- [ ] Vite production build completes and writes `dist/`.
- [ ] The main app bundle remains separate from lazy PDF task chunks.
- [ ] `dist/index.html`, `dist/manifest.webmanifest`, and `dist/sw.js` use relative app-shell paths for GitHub Pages project-site deployment.

## Local Browser Setup

Run from `apps/privacy-first-pdf-toolbox`:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

If the old UI appears, open `http://127.0.0.1:5173/?v=latest` to bypass the old app-shell cache. If the old UI still appears, clear site data for `127.0.0.1` because older MVP builds registered a service worker during local development.

## Test Files

Generate standard validation files from `apps/privacy-first-pdf-toolbox`:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd run fixtures
```

The generated files are written to `apps/privacy-first-pdf-toolbox/validation-fixtures/` and are ignored by git.

Confirm these files exist before manual validation:

- [ ] Two PNG or JPEG images with visibly different content.
- [ ] Two small PDF files that open correctly.
- [ ] One 4-page PDF with clearly numbered pages for Split PDF and Reorder Pages.
- [ ] One PDF that may already be optimized, to confirm Optimize PDF gives an honest before/after result.
- [ ] One unsupported file type, such as `.txt`, for validation checks.
- [ ] One file larger than 25 MB, if available, for file-size validation.

## Manual Product Checks

First-screen checks:

- [ ] Header states local-first PDF processing.
- [ ] Tool cards are visible for Images to PDF, Merge PDFs, Split PDF, Reorder Pages, Optimize PDF, and Sign PDF.
- [ ] Each tool card has a short description.
- [ ] Workspace states: `Files are processed in this browser tab, not uploaded to a server.`
- [ ] Workspace shows `Save destination: Downloads` before choosing a custom folder.
- [ ] Processing requires the user to click `Start processing`.
- [ ] Unsupported file types show a clear warning before processing.
- [ ] Files over 25 MB show a recoverable validation message.

Images to PDF:

- [ ] Select at least two PNG/JPEG files.
- [ ] Reorder the selected images before processing.
- [ ] Click `Start processing`.
- [ ] Output opens as a valid PDF.
- [ ] Output page order matches the displayed image order.

Merge PDFs:

- [ ] Select only one PDF and confirm processing stays disabled or shows the minimum-file requirement.
- [ ] Select at least two PDFs.
- [ ] Reorder the displayed files.
- [ ] Click `Start processing`.
- [ ] Output opens as a valid PDF.
- [ ] Output page order follows the displayed file order.

Split PDF:

- [ ] Select the 4-page test PDF.
- [ ] Confirm the selected PDF page count appears.
- [ ] Confirm the page range is prefilled as `1-4`.
- [ ] Enter `1-3,5` and confirm processing is disabled or shows an out-of-range warning.
- [ ] Enter `1-2,4`, click `Start processing`, and confirm the output contains only pages 1, 2, and 4.

Reorder Pages:

- [ ] Select the 4-page test PDF.
- [ ] Confirm the selected PDF page count appears.
- [ ] Confirm the page order is prefilled as `1,2,3,4`.
- [ ] Enter `3,1,2` and confirm processing is disabled or shows a missing-page warning.
- [ ] Enter `3,1,2,4`, click `Start processing`, and confirm the output keeps every page exactly once in that order.

Optimize PDF:

- [ ] Select one PDF file.
- [ ] Click `Start processing`.
- [ ] Output opens as a valid PDF.
- [ ] Success message shows before/after file size.
- [ ] If output is larger or unchanged, the message explains that the PDF may already be optimized.

Sign PDF:

- [ ] Select one PDF and enter a text signature.
- [ ] Click `Start processing` and confirm the output opens with a visible signature.
- [ ] Try blank-only text and confirm processing is disabled or shows a clear warning unless a handwritten signature exists.
- [ ] Draw a handwritten signature and confirm it can be cleared.

Completion flow:

- [ ] Success message shows output filename and save destination.
- [ ] `Process another batch` clears selected files.

## Browser Checks

Check at least one Chromium-based browser because custom save folder support depends on the File System Access API.

- [ ] Downloads fallback works when no folder is selected.
- [ ] `Choose save folder` appears when `showDirectoryPicker` is available.
- [ ] After choosing a folder, workspace shows `Save destination: Selected folder`.
- [ ] Selected folder save path writes the generated PDF.
- [ ] Drag-and-drop file selection works.
- [ ] Mobile-width layout keeps file rows and action buttons readable.
- [ ] Service worker does not keep an old UI after a cache-busting URL, hard reload, or site data reset.

Known limitation:

- Safari and Firefox are expected to use browser Downloads instead of custom folder selection.

## Privacy Checks

- [ ] No source file upload endpoint exists.
- [ ] No analytics, tracking, or external file processing is added.
- [ ] Header privacy copy still states local-first processing.
- [ ] Feedback link opens GitHub issue creation and does not transmit user files.

## GitHub Pages Release

Before publishing:

- [ ] Push local commits to `main`.
- [ ] Confirm GitHub Pages is configured to use GitHub Actions.
- [ ] Run or wait for `Deploy Privacy PDF Toolbox`.
- [ ] Confirm the workflow runs `npm test` and `npm run build`.
- [ ] Open the deployed page and repeat the critical manual checks.

## Rollback Notes

If a release fails after publishing:

- Revert or fix forward locally.
- Run the automated verification gate again.
- Push the recovery commit and let the Pages workflow redeploy.
