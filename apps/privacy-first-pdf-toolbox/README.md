# Privacy PDF Toolbox

Local-first PDF tools for images, merging, and signatures. The app runs in the browser and keeps source files local by default.

## Run Locally

```powershell
npm install
npm run dev
```

The dev server uses Vite and listens on `127.0.0.1`.

## Verify

```powershell
npm test
npm run build
```

## Deploy Preview

The repository includes a GitHub Pages workflow at `.github/workflows/deploy-privacy-pdf-toolbox.yml`.

To publish the app:

1. Push `main` to GitHub.
2. In the repository settings, enable Pages with GitHub Actions as the source.
3. Run the `Deploy Privacy PDF Toolbox` workflow, or let it run automatically after app changes on `main`.

The workflow runs tests, builds `apps/privacy-first-pdf-toolbox/dist`, and deploys that folder to GitHub Pages.

## Feedback

The app header includes a `Send feedback` link that opens a prefilled GitHub issue in `lordjun/app-builder` with the `feedback` label.
