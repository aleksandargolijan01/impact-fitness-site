import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallComponent } from './components/pwa-install/pwa-install.component';
import { ScrollToTopComponent } from './components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallComponent, ScrollToTopComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  private revealObserver?: IntersectionObserver;
  private removeOnlineListener?: () => void;
  private removeOfflineListener?: () => void;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  readonly isOffline = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const updateOnlineStatus = () => this.isOffline.set(!navigator.onLine);

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    this.removeOnlineListener = () => window.removeEventListener('online', updateOnlineStatus);
    this.removeOfflineListener = () => window.removeEventListener('offline', updateOnlineStatus);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const revealTargets = Array.from(
      this.host.nativeElement.querySelectorAll(
        '.section, .hero-copy, .hero-panel, .card, .gallery-grid img, .map-wrap',
      ),
    ) as HTMLElement[];

    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach((target) => this.renderer.addClass(target, 'is-visible'));
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    revealTargets.forEach((target, index) => {
      this.renderer.addClass(target, 'reveal');
      target.style.setProperty('--reveal-delay', `${Math.min(index * 42, 260)}ms`);

      if (prefersReducedMotion) {
        this.renderer.addClass(target, 'is-visible');
      }
    });

    if (prefersReducedMotion) {
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          this.renderer.addClass(entry.target, 'is-visible');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.14 },
    );

    revealTargets.forEach((target) => this.revealObserver?.observe(target));
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.removeOnlineListener?.();
    this.removeOfflineListener?.();
  }
}
