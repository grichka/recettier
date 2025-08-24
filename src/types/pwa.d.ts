// PWA and Service Worker type definitions

declare global {
  interface ServiceWorkerRegistration {
    sync?: SyncManager;
  }

  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }

  interface Navigator {
    standalone?: boolean;
  }

  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
}

export interface StorageEstimate {
  quota?: number;
  usage?: number;
  usageDetails?: Record<string, number>;
}

export {};