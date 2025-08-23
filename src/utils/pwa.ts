// Service Worker registration and PWA utilities
import React from 'react';
import type { BeforeInstallPromptEvent, PWAInstallStatus } from '../types/pwa';

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installStatusCallbacks: ((status: PWAInstallStatus) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Register service worker (VitePWA will handle this automatically)
    this.setupInstallPromptListener();
    this.checkStandaloneMode();
  }

  private setupInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('PWA: Install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyInstallStatus();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.deferredPrompt = null;
      this.notifyInstallStatus();
    });
  }

  private checkStandaloneMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log(`PWA: Running in ${isStandalone ? 'standalone' : 'browser'} mode`);
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log(`PWA: Install prompt result: ${choiceResult.outcome}`);
      
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA: Install prompt failed', error);
      return false;
    }
  }

  public getInstallStatus(): PWAInstallStatus {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isStandalone || (window.navigator as { standalone?: boolean }).standalone === true;
    
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled,
      isStandalone,
    };
  }

  public onInstallStatusChange(callback: (status: PWAInstallStatus) => void) {
    this.installStatusCallbacks.push(callback);
  }

  private notifyInstallStatus() {
    const status = this.getInstallStatus();
    this.installStatusCallbacks.forEach(callback => callback(status));
  }

  public async requestBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register(tag);
          console.log(`PWA: Background sync registered for tag: ${tag}`);
        }
      } catch (error) {
        console.error('PWA: Background sync registration failed', error);
      }
    }
  }

  public async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('PWA: Storage estimate', estimate);
        return estimate;
      } catch (error) {
        console.error('PWA: Storage estimate failed', error);
      }
    }
    return null;
  }
}

// Create singleton instance
export const pwaService = new PWAService();

// React hook for PWA functionality
export function usePWA() {
  const [installStatus, setInstallStatus] = React.useState<PWAInstallStatus>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
  });

  React.useEffect(() => {
    // Initial status
    setInstallStatus(pwaService.getInstallStatus());

    // Listen for status changes
    pwaService.onInstallStatusChange(setInstallStatus);

    // Listen for updates
    const handleUpdate = () => {
      console.log('PWA: Update available');
      // You can show a notification here
    };

    window.addEventListener('pwa-update-available', handleUpdate);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  const install = React.useCallback(async () => {
    return await pwaService.showInstallPrompt();
  }, []);

  const requestSync = React.useCallback(async (tag: string) => {
    return await pwaService.requestBackgroundSync(tag);
  }, []);

  return {
    ...installStatus,
    install,
    requestSync,
  };
}