import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  async goToSection(sectionId: string, event?: Event): Promise<void> {
    event?.preventDefault();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const targetId = this.normalizeSectionId(sectionId);

    if (this.router.url.split('#')[0] !== '/') {
      const navigationEnd = firstValueFrom(
        this.router.events.pipe(
          filter((routerEvent): routerEvent is NavigationEnd => routerEvent instanceof NavigationEnd),
        ),
      );

      await this.router.navigate(['/'], { fragment: targetId });
      await navigationEnd;
      await this.waitForRender();
    }

    this.scrollToSection(targetId);
  }

  scrollToSection(sectionId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const targetId = this.normalizeSectionId(sectionId);
    const element = this.document.getElementById(targetId);

    if (!element) {
      return;
    }

    const header = this.document.querySelector<HTMLElement>('header.site-header');
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const y = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;

    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    this.updateBrowserHash(targetId);
  }

  scrollToInitialHash(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sectionId = this.document.location.hash.replace('#', '');

    if (sectionId) {
      this.scrollToSection(sectionId);
    }
  }

  private normalizeSectionId(sectionId: string): string {
    const aliases: Record<string, string> = {
      hero: 'home',
      services: 'trainings',
      booking: 'booking-form',
    };

    return aliases[sectionId] ?? sectionId;
  }

  private updateBrowserHash(sectionId: string): void {
    const url = new URL(this.document.location.href);
    url.hash = sectionId;
    history.pushState(null, '', url);
  }

  private waitForRender(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }
}
