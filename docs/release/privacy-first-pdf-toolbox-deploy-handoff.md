# Privacy PDF Toolbox Deploy Handoff

This is the pre-push handoff for manually publishing the Privacy PDF Toolbox MVP.

## Local Push State

Before pushing, confirm whether local `main` is ahead of `origin/main`; Codex may have created local verification or polish commits that still need a manual push.

Recent relevant commits at the time this handoff was last updated:

```text
183868f Polish PDF toolbox workflow feedback
ca9aa0c Elevate PDF toolbox professional UI
ff778ac Polish PDF toolbox commercial UI
77d1152 Refresh PDF toolbox workbench UI
22def4a Update remaining Pages workflow actions
```

Codex should not push future commits unless the user explicitly changes the current no-push instruction.

## Manual Push

From the repository root:

```powershell
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' status -sb
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' push origin main
```

If using a normal Git checkout instead of `.git-upload`, use:

```powershell
git status -sb
git push origin main
```

## GitHub Pages Settings

Repository: `lordjun/app-builder`

Check these settings in GitHub:

1. Go to `Settings > Pages`.
2. Set source to `GitHub Actions`.
3. Confirm the workflow named `Deploy Privacy PDF Toolbox` runs after pushing `main`.
4. Open the workflow run and verify `Test`, `Build`, and `Deploy to GitHub Pages` pass.

## Expected Deploy URL

For a normal GitHub Pages project site, the expected app URL is:

```text
https://lordjun.github.io/app-builder/
```

The app now uses relative asset paths so it can run from this `/app-builder/` subdirectory.

## First Deployed Page Checks

After deployment opens:

- [ ] Page title shows `Privacy PDF Toolbox`.
- [ ] Header shows `Local-first document tools`.
- [ ] Tool buttons show `Images to PDF`, `Merge PDFs`, and `Sign PDF`.
- [ ] Browser dev tools Network panel does not show failed requests for `/assets/...`, `/manifest.webmanifest`, `/icon.svg`, or `/sw.js` at the domain root.
- [ ] `Images to PDF` shows `Drop or choose PNG/JPEG images.`
- [ ] The main confirmation button for Images to PDF is visibly labeled `Convert to PDF`.
- [ ] The workspace shows `Output setup` and `0 files selected` before upload.
- [ ] `Merge PDFs` shows `Drop or choose at least two PDF files.`
- [ ] `Reorder Pages` shows a confirmation button labeled `Apply page order`.
- [ ] `Sign PDF` shows the signature text input, signature pad, and PDF upload zone.

## Release Gate

Before pushing, this local gate should pass:

```powershell
cd apps/privacy-first-pdf-toolbox
npm test
npm run build
```

Current verified state before this handoff:

- Validation fixtures generated successfully with `npm run fixtures`.
- 15 Vitest files passed.
- 69 tests passed.
- Production build completed.
- `dist/index.html`, `dist/manifest.webmanifest`, and `dist/sw.js` use relative app-shell paths.

## Known Limitations

- Custom save folder selection works only in browsers with `window.showDirectoryPicker`, mainly Chromium-based browsers.
- Safari and Firefox use Downloads fallback.
- Service worker caching can keep an older UI during local testing; clear site data or hard reload when verifying UI changes.
- Large PDFs are limited by browser and device memory.
