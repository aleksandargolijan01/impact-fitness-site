import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private readonly dismissedKey = 'pwaInstallPromptDismissed';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly dismissed = signal(false);
  private readonly installed = signal(false);

  private readonly installAvailable = computed(() => !!this.deferredPrompt() && !this.installed());
  readonly shouldShowPrompt = computed(() => this.canInstall() && !this.isDismissed());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.dismissed.set(localStorage.getItem(this.dismissedKey) === 'true');

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.deferredPrompt.set(null);
    });

    if (window.matchMedia?.('(display-mode: standalone)').matches) {
      this.installed.set(true);
    }
  }

  canInstall(): boolean {
    return this.installAvailable();
  }

  isDismissed(): boolean {
    return this.dismissed();
  }

  isInstalled(): boolean {
    return this.installed();
  }

  dismissPrompt(): void {
    this.dismissed.set(true);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.dismissedKey, 'true');
    }
  }

  async promptInstall(): Promise<boolean> {
    const prompt = this.deferredPrompt();

    if (!prompt) {
      return false;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    this.deferredPrompt.set(null);

    if (choice.outcome === 'accepted') {
      this.installed.set(true);
    }

    return choice.outcome === 'accepted';
  }
}
