type ServiceWorkerLike = {
  register: (scriptURL: string) => Promise<unknown>;
};

type WindowLike = {
  addEventListener: (event: 'load', handler: () => void) => void;
};

export type RegisterServiceWorkerOptions = {
  serviceWorker?: ServiceWorkerLike;
  windowRef?: WindowLike;
  scriptUrl?: string;
};

export function registerServiceWorker(options: RegisterServiceWorkerOptions = {}): void {
  const serviceWorker = options.serviceWorker ?? getDefaultServiceWorker();
  const windowRef = options.windowRef ?? window;
  const scriptUrl = options.scriptUrl ?? './sw.js';

  if (!serviceWorker) {
    return;
  }

  windowRef.addEventListener('load', () => {
    void serviceWorker.register(scriptUrl);
  });
}

function getDefaultServiceWorker(): ServiceWorkerLike | undefined {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  return navigator.serviceWorker;
}
