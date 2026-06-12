type ServiceWorkerLike = {
  register?: (scriptURL: string) => Promise<unknown>;
  getRegistrations?: () => Promise<ReadonlyArray<{ unregister: () => Promise<boolean> }>>;
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

  if (!serviceWorker?.register) {
    return;
  }

  const register = serviceWorker.register.bind(serviceWorker);
  windowRef.addEventListener('load', () => {
    void register(scriptUrl);
  });
}

export async function unregisterServiceWorkers(options: Pick<RegisterServiceWorkerOptions, 'serviceWorker'> = {}): Promise<void> {
  const serviceWorker = options.serviceWorker ?? getDefaultServiceWorker();

  if (!serviceWorker?.getRegistrations) {
    return;
  }

  const registrations = await serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

function getDefaultServiceWorker(): ServiceWorkerLike | undefined {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  return navigator.serviceWorker;
}
