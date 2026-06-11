# Agent Handoff: Privacy PDF Toolbox

## Product Intent

Build a local-first PDF utility MVP that validates demand for a simpler, privacy-friendly alternative to bloated or low-trust PDF tools.

The MVP should stay focused on three high-frequency jobs:

- Convert images to PDF.
- Merge multiple PDFs.
- Sign one PDF with text or handwriting.

## Current Technical Stack

- Vite
- React
- TypeScript
- pdf-lib
- Vitest
- GitHub Pages workflow

## Development Rules

- Keep processing local to the browser.
- Do not add backend upload paths.
- Do not add analytics, tracking, accounts, or payment in the MVP without explicit user approval.
- Preserve explicit user confirmation before PDF processing starts.
- Keep PDF task modules lazy-loaded so the initial app bundle does not absorb all PDF processing code.
- Keep UI changes practical and task-focused; this is a utility surface, not a marketing landing page.
- Do not push from Codex. The user currently wants to manually push accumulated local commits.

## Verification Commands

Run from `apps/privacy-first-pdf-toolbox`:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd test
npm.cmd run build
```

Expected result:

- All Vitest suites pass.
- TypeScript compiles.
- Vite writes `dist/`.

## Git Notes

This workspace uses `.git-upload` for the active repository metadata during Codex work.

From the repository root:

```powershell
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' status -sb
```

Commit locally when a stage is complete. Do not run `git push` unless the user explicitly changes the instruction.

## Release References

- App README: `apps/privacy-first-pdf-toolbox/README.md`
- Release checklist: `docs/release/privacy-first-pdf-toolbox-checklist.md`
- Deploy workflow: `.github/workflows/deploy-privacy-pdf-toolbox.yml`
