import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import serviceWorkerSource from '../../public/sw.js?raw';
import mainSource from '../main.tsx?raw';
import manifestRaw from '../../public/manifest.webmanifest?raw';
import registerServiceWorkerSource from './registerServiceWorker.ts?raw';

describe('release paths', () => {
  it('uses relative HTML asset links for GitHub Pages project sites', () => {
    expect(html).toContain('href="./manifest.webmanifest"');
    expect(html).toContain('href="./icon.svg"');
  });

  it('keeps public metadata aligned with the shipped PDF tools', () => {
    const manifest = JSON.parse(manifestRaw);

    expect(html).toContain('splitting, reordering, optimization');
    expect(manifest.description).toContain('splitting, reordering, optimization');
  });

  it('uses relative PWA manifest paths for subdirectory deployments', () => {
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.icons[0].src).toBe('./icon.svg');
  });

  it('registers the service worker with a relative script URL', () => {
    expect(registerServiceWorkerSource).toContain("scriptUrl ?? './sw.js'");
  });

  it('registers the service worker only for production builds', () => {
    expect(mainSource).toContain('if (import.meta.env.PROD)');
    expect(mainSource).toContain('registerServiceWorker();');
  });

  it('does not cache runtime module or chunk requests in the service worker', () => {
    expect(serviceWorkerSource).not.toContain('cache.put(request');
    expect(serviceWorkerSource).toContain('APP_SHELL_REQUESTS');
  });
});
