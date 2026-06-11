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
npm test
npm run build
```

Pass criteria:

- [ ] Vitest reports all test files passed.
- [ ] TypeScript compilation completes without errors.
- [ ] Vite production build completes and writes `dist/`.
- [ ] The main app bundle remains separate from lazy PDF task chunks.

## Manual Product Checks

Run the app locally and verify:

- [ ] Images to PDF accepts one or more PNG/JPEG files.
- [ ] Images can be reordered before processing.
- [ ] Merge PDFs requires at least two PDF files.
- [ ] Merge output follows the displayed file order.
- [ ] Sign PDF requires one PDF plus text or handwritten signature.
- [ ] Text signature trims blank-only input before signing.
- [ ] Handwritten signature can be cleared.
- [ ] Processing requires the user to click `Start processing`.
- [ ] Success message shows output filename and save destination.
- [ ] `Process another batch` clears selected files.
- [ ] Unsupported file types show a clear warning before processing.
- [ ] Files over 25 MB show a recoverable validation message.

## Browser Checks

Check at least one Chromium-based browser because custom save folder support depends on the File System Access API.

- [ ] Downloads fallback works when no folder is selected.
- [ ] `Choose save folder` appears when `showDirectoryPicker` is available.
- [ ] Selected folder save path writes the generated PDF.
- [ ] Drag-and-drop file selection works.
- [ ] Mobile-width layout keeps file rows and action buttons readable.
- [ ] Service worker does not keep an old UI after a hard reload or site data reset.

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
