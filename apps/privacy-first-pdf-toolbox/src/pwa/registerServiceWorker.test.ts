import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker, unregisterServiceWorkers } from './registerServiceWorker';

describe('registerServiceWorker', () => {
  it('registers the app service worker after window load', () => {
    let loadHandler: (() => void) | undefined;
    const register = vi.fn(async () => undefined);
    const windowRef = {
      addEventListener: vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'load' && typeof handler === 'function') {
          loadHandler = handler as () => void;
        }
      }),
    };

    registerServiceWorker({
      serviceWorker: { register },
      windowRef,
    });

    expect(register).not.toHaveBeenCalled();
    expect(windowRef.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));

    loadHandler?.();

    expect(register).toHaveBeenCalledWith('./sw.js');
  });

  it('does nothing when service workers are unavailable', () => {
    const windowRef = {
      addEventListener: vi.fn(),
    };

    registerServiceWorker({
      serviceWorker: undefined,
      windowRef,
    });

    expect(windowRef.addEventListener).not.toHaveBeenCalled();
  });

  it('unregisters existing service workers during local development cleanup', async () => {
    const unregister = vi.fn(async () => true);
    const getRegistrations = vi.fn(async () => [{ unregister }, { unregister }]);

    await unregisterServiceWorkers({
      serviceWorker: { getRegistrations },
    });

    expect(getRegistrations).toHaveBeenCalledTimes(1);
    expect(unregister).toHaveBeenCalledTimes(2);
  });
});
