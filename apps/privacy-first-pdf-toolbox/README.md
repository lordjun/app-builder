# Privacy PDF Toolbox

Local-first PDF tools for images, merging, splitting, reordering, and signatures. The app runs in the browser and keeps source files local by default.

## Current MVP

- Images to PDF: accepts PNG/JPEG files, preserves selected order, and exports one PDF.
- Merge PDFs: accepts two or more PDF files and merges them in the displayed order.
- Split PDF: accepts one PDF, lets the user enter page ranges such as `1-3,5`, and exports a new PDF with only those pages.
- Reorder Pages: accepts one PDF, lets the user enter a complete page order such as `3,1,2,4`, and exports a reordered PDF.
- Page count hint: Split PDF and Reorder Pages show the selected PDF page count to reduce page entry mistakes.
- Sign PDF: accepts one PDF and applies either text signature or handwritten signature on the first page.
- Local save flow: defaults to browser Downloads, with optional folder selection in browsers that support the File System Access API.
- PWA shell: includes a web manifest, app icon, and service worker for cached app-shell loading.

## Run Locally

```powershell
npm install
npm run dev
```

The dev server uses Vite and listens on `127.0.0.1`.

When using the portable workspace Node runtime, prepend it to `PATH` first:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd install
npm.cmd run dev
```

## Verify

```powershell
npm test
npm run build
```

The release gate is:

```powershell
npm test
npm run build
```

Expected result for the current MVP: all Vitest suites pass, TypeScript compiles, and Vite writes production assets to `dist/`.

## Browser Support Notes

- Source files are selected by the user through browser file inputs or drag-and-drop.
- Files are processed in browser memory; there is no backend upload path in the MVP.
- Maximum file size validation is currently 25 MB per file.
- Custom save folder selection requires `window.showDirectoryPicker`, currently available in Chromium-based browsers. Other browsers fall back to Downloads.
- The service worker caches the app shell. During local testing, reload or clear site data if an older UI remains visible after code changes.
- Very large PDFs may be limited by device memory, especially on mobile browsers.

## PWA Notes

The PWA assets live in `public/`:

- `manifest.webmanifest`
- `icon.svg`
- `sw.js`

The service worker cache name is `privacy-pdf-toolbox-v1`. Increment it when changing cached app-shell behavior that must invalidate old clients.

## Deploy Preview

The repository includes a GitHub Pages workflow at `.github/workflows/deploy-privacy-pdf-toolbox.yml`.

To publish the app:

1. Push `main` to GitHub.
2. In the repository settings, enable Pages with GitHub Actions as the source.
3. Run the `Deploy Privacy PDF Toolbox` workflow, or let it run automatically after app changes on `main`.

The workflow runs tests, builds `apps/privacy-first-pdf-toolbox/dist`, and deploys that folder to GitHub Pages.

## Release Checklist

Use [Privacy PDF Toolbox Release Checklist](../../docs/release/privacy-first-pdf-toolbox-checklist.md) before pushing or publishing a release.

Use [Post-Launch Validation Plan](../../docs/product/privacy-first-pdf-toolbox-post-launch-validation.md) after the public release to decide the next product iteration.

## Feedback

The app header includes a `Send feedback` link that opens a prefilled GitHub issue in `lordjun/app-builder` with the `feedback` label.
