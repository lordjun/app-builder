import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import manifestRaw from '../../public/manifest.webmanifest?raw';
import registerServiceWorkerSource from './registerServiceWorker.ts?raw';

describe('release paths', () => {
  it('uses relative HTML asset links for GitHub Pages project sites', () => {
    expect(html).toContain('href="./manifest.webmanifest"');
    expect(html).toContain('href="./icon.svg"');
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
});
