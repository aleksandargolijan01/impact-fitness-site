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
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
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
  private static readonly touchTargetSelector = [
    '.btn',
    '.card',
    '.brand',
    '.nav a',
    '.nav-toggle',
    '.header-cta',
    '.header-link',
    '.footer-install button',
    '.site-footer a',
    '.gallery-grid img',
    '.trainer-grid article',
    '.contact-list p',
    '.map-wrap',
    '.ps__card',
    '.schedule-grid article',
    '.whatsapp-float',
    '.booking-steps span',
    '.stats article',
    '.pricing-grid article',
    '.service-grid article',
    '.hero-proof span',
    '.hero-panel',
    '.achievement-badge',
    'tbody tr',
  ].join(',');

  private revealObserver?: IntersectionObserver;
  private activeTouchElement?: HTMLElement;
  private touchFeedbackTimeout?: number;
  private removeOnlineListener?: () => void;
  private removeOfflineListener?: () => void;
  private removePointerDownListener?: () => void;
  private removePointerUpListener?: () => void;
  private removePointerCancelListener?: () => void;
  private removeTouchMoveListener?: () => void;
  private routerSubscription?: Subscription;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
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
    this.registerTouchFeedback();
    this.registerRouteSeo();
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
    this.removePointerDownListener?.();
    this.removePointerUpListener?.();
    this.removePointerCancelListener?.();
    this.removeTouchMoveListener?.();
    this.routerSubscription?.unsubscribe();
    this.clearTouchFeedback();
  }

  private registerRouteSeo(): void {
    this.applySeoForUrl(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.applySeoForUrl(event.urlAfterRedirects));
  }

  private applySeoForUrl(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    const isPrivateRoute =
      path.startsWith('/admin') ||
      path.startsWith('/user') ||
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/membership');

    if (isPrivateRoute) {
      this.title.setTitle('Impact Fitness aplikacija');
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      this.meta.updateTag({
        name: 'description',
        content: 'Privatni deo Impact Fitness aplikacije za korisnike i administratore.',
      });
      return;
    }

    this.title.setTitle('Impact Fitness | Teretana u Beogradu');
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({
      name: 'description',
      content:
        'Impact Fitness je moderna teretana u Beogradu, Vojvode Vlahovica 60. Personalni treninzi, grupni treninzi, funkcionalni trening i probni trening.',
    });
  }

  private registerTouchFeedback(): void {
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        return;
      }

      const target = (event.target as Element | null)?.closest<HTMLElement>(
        App.touchTargetSelector,
      );

      if (!target) {
        this.clearTouchFeedback();
        return;
      }

      this.clearTouchFeedback();
      this.activeTouchElement = target;
      this.renderer.addClass(target, 'is-touch-active');
    };

    const clearTouchFeedback = () => this.clearTouchFeedback(180);
    const cancelTouchFeedback = () => this.clearTouchFeedback();

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', clearTouchFeedback, { passive: true });
    window.addEventListener('pointercancel', clearTouchFeedback, { passive: true });
    window.addEventListener('touchmove', cancelTouchFeedback, { passive: true });

    this.removePointerDownListener = () => window.removeEventListener('pointerdown', onPointerDown);
    this.removePointerUpListener = () => window.removeEventListener('pointerup', clearTouchFeedback);
    this.removePointerCancelListener = () =>
      window.removeEventListener('pointercancel', clearTouchFeedback);
    this.removeTouchMoveListener = () => window.removeEventListener('touchmove', cancelTouchFeedback);
  }

  private clearTouchFeedback(delay = 0): void {
    if (this.touchFeedbackTimeout) {
      window.clearTimeout(this.touchFeedbackTimeout);
      this.touchFeedbackTimeout = undefined;
    }

    if (!this.activeTouchElement) {
      return;
    }

    const element = this.activeTouchElement;

    const removeClass = () => {
      this.renderer.removeClass(element, 'is-touch-active');

      if (this.activeTouchElement === element) {
        this.activeTouchElement = undefined;
      }
    };

    if (delay > 0) {
      this.touchFeedbackTimeout = window.setTimeout(removeClass, delay);
      return;
    }

    removeClass();
  }
}
