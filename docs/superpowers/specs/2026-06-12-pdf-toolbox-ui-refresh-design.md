# PDF Toolbox UI Refresh Design

## Goal

Improve the Privacy PDF Toolbox page so it feels like a polished repeated-use productivity tool rather than a simple demo page.

## Approved Direction

Use the Workbench Two-Column direction:

- Desktop: persistent tool rail on the left, active tool workspace on the right.
- Mobile: single-column layout with the tool rail becoming a compact top grid.
- Keep the current six tools and processing behavior unchanged.

## Visual Principles

- Practical and professional: quiet document-tool interface, not a marketing landing page.
- Clear hierarchy: product identity, tool navigation, current task, file input, settings, output action.
- Stronger affordances: selected tool, upload zone, output filename, warnings, and status should be easy to scan.
- Local-first trust should be visible but not oversized.
- Avoid heavy illustration, decorative gradients, or large hero treatment.

## Scope

In scope:

- Restructure the page into a workbench shell.
- Add an active tool header inside the workspace.
- Improve spacing, borders, shadows, backgrounds, and responsive behavior.
- Improve file action button glyphs to avoid mojibake/garbled rendering.
- Preserve all existing PDF behavior.
- Update tests for the workbench layout.

Out of scope:

- New PDF features.
- New dependencies.
- Figma integration.
- Payment, accounts, analytics, or upload services.

## Testing

- Unit/component tests should still verify all six tool buttons, current tool requirements, local processing status, and explicit start behavior.
- Add a layout-level test that verifies the workbench navigation and active tool panel exist.
- Run full Vitest suite and production build.
- Use browser verification for desktop and mobile viewport checks.
