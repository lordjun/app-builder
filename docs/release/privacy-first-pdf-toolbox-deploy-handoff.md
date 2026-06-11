# Privacy PDF Toolbox Deploy Handoff

This is the final pre-push handoff for manually publishing the Privacy PDF Toolbox MVP.

## Local Commits Waiting To Push

Current local `main` is ahead of `origin/main` by 5 commits:

```text
942971e Fix PDF toolbox Pages asset paths
27d59dc Document PDF toolbox release checklist
169885d Polish PDF file actions and signing guardrails
8c50bfe Improve PDF file input workflow
d47eb7e Add completion details for PDF output
```

Codex should not push these commits. The user will push manually.

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
- [ ] `Merge PDFs` shows `Drop or choose at least two PDF files.`
- [ ] `Sign PDF` shows the signature text input, signature pad, and PDF upload zone.

## Release Gate

Before pushing, this local gate should pass:

```powershell
cd apps/privacy-first-pdf-toolbox
npm test
npm run build
```

Current verified state before this handoff:

- 9 Vitest files passed.
- 39 tests passed.
- Production build completed.
- `dist/index.html`, `dist/manifest.webmanifest`, and `dist/sw.js` use relative app-shell paths.

## Known Limitations

- Custom save folder selection works only in browsers with `window.showDirectoryPicker`, mainly Chromium-based browsers.
- Safari and Firefox use Downloads fallback.
- Service worker caching can keep an older UI during local testing; clear site data or hard reload when verifying UI changes.
- Large PDFs are limited by browser and device memory.
