# PDF Toolbox UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Privacy PDF Toolbox page into a polished workbench-style interface.

**Architecture:** Keep all PDF processing logic in `App.tsx` unchanged. Restructure only the rendered layout and rewrite CSS for the desktop two-column workbench and mobile single-column layout.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, Vite.

---

### Task 1: Add Workbench Layout Tests

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/App.test.tsx`

- [ ] Add a test that renders `App`, verifies a `PDF tools` navigation region exists, verifies `Active tool` text exists, and verifies the initial active panel is `Images to PDF`.

- [ ] Run:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd test -- src/App.test.tsx
```

Expected: the new test fails before implementation.

### Task 2: Restructure React Markup

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/App.tsx`

- [ ] Wrap tool buttons and workspace in a `toolbox-shell`.
- [ ] Move the tools into an `aside` with class `tool-rail` and `aria-label="PDF tools"`.
- [ ] Add a `workspace-header` in the active workspace with `Active tool`, current tool label, and current tool description.
- [ ] Keep all existing form labels, button names, state transitions, and processing functions unchanged.
- [ ] Replace garbled file action symbols with ASCII-safe `^`, `v`, and `x`.

### Task 3: Rewrite Visual Styling

**Files:**
- Modify: `apps/privacy-first-pdf-toolbox/src/styles.css`

- [ ] Add page background, workbench shell, side navigation, active panel, upload zone, button, selected file, warning, and mobile responsive styles.
- [ ] Ensure desktop uses two columns and mobile uses one column.
- [ ] Keep cards at 8px radius where practical.
- [ ] Avoid decorative orbs, heavy gradients, and marketing hero layout.

### Task 4: Verify

**Files:**
- No source edits unless verification finds an issue.

- [ ] Run full tests:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd test
```

- [ ] Run production build:

```powershell
$env:PATH='..\..\.tools\node\node-v24.16.0-win-x64;' + $env:PATH
npm.cmd run build
```

- [ ] Browser check `http://127.0.0.1:5173/` desktop.
- [ ] Browser check 375px mobile viewport for no horizontal overflow.

### Task 5: Commit

**Files:**
- Stage implementation, tests, spec, plan, and `.gitignore`.

- [ ] Commit:

```powershell
& 'C:\Users\Lordjun\Documents\Git\tools\PortableGit\cmd\git.exe' --git-dir='.git-upload' --work-tree='.' commit -m "Refresh PDF toolbox workbench UI"
```
