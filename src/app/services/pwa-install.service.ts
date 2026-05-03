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
  private readonly iosDevice = signal(false);
  private readonly secureContext = signal(false);

  private readonly installAvailable = computed(() => !!this.deferredPrompt() && !this.installed());
  readonly shouldShowPrompt = computed(() => this.canInstall() && !this.isDismissed());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.dismissed.set(localStorage.getItem(this.dismissedKey) === 'true');
    this.secureContext.set(window.isSecureContext);
    this.iosDevice.set(this.detectIosDevice());

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.deferredPrompt.set(null);
    });

    if (window.matchMedia?.('(display-mode: standalone)').matches || this.isIosStandalone()) {
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

  isIos(): boolean {
    return this.iosDevice();
  }

  isSecure(): boolean {
    return this.secureContext();
  }

  installUnavailableMessage(): string {
    if (this.isInstalled()) {
      return 'Aplikacija je vec instalirana.';
    }

    if (this.isIos()) {
      return 'Na iPhone-u otvori sajt u Safari browseru, pritisni Share i izaberi Add to Home Screen.';
    }

    if (!this.isSecure()) {
      return 'Instalacija radi samo preko HTTPS adrese.';
    }

    return 'Otvori sajt u Chrome/Edge browseru i sacekaj da browser pripremi instalaciju.';
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

  private detectIosDevice(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform.toLowerCase();
    const hasTouch = window.navigator.maxTouchPoints > 1;

    return /iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && hasTouch);
  }

  private isIosStandalone(): boolean {
    return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  }
}
