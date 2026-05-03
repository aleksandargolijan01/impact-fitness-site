import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  template: `
    <button
      class="scroll-top"
      type="button"
      [class.is-visible]="isVisible()"
      [attr.aria-hidden]="!isVisible()"
      [attr.tabindex]="isVisible() ? 0 : -1"
      aria-label="Vrati se na vrh stranice"
      (click)="scrollToTop()"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5 5.5 11.5l1.4 1.4L11 8.8V20h2V8.8l4.1 4.1 1.4-1.4L12 5Z" />
      </svg>
    </button>
  `,
  styles: `
    :host {
      pointer-events: none;
    }

    .scroll-top {
      position: fixed;
      right: 20px;
      bottom: calc(92px + env(safe-area-inset-bottom));
      z-index: 31;
      display: grid;
      width: 52px;
      height: 52px;
      place-items: center;
      border: 1px solid rgba(255, 51, 72, 0.34);
      border-radius: 50%;
      background:
        linear-gradient(145deg, rgba(255, 51, 72, 0.2), rgba(255, 255, 255, 0.045)),
        rgba(10, 11, 14, 0.94);
      color: #fff;
      box-shadow:
        0 18px 42px rgba(226, 29, 47, 0.22),
        0 1px 0 rgba(255, 255, 255, 0.08) inset;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px) scale(0.92);
      backdrop-filter: blur(14px);
      transition:
        opacity 220ms ease,
        transform 260ms var(--ease-spring),
        border-color 200ms ease,
        background 200ms ease,
        box-shadow 200ms ease;
    }

    .scroll-top.is-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
      animation: scrollTopIn 420ms var(--ease-spring) both;
    }

    .scroll-top:hover,
    .scroll-top:focus-visible {
      border-color: rgba(255, 51, 72, 0.62);
      background:
        linear-gradient(145deg, rgba(226, 29, 47, 0.84), rgba(255, 51, 72, 0.64)),
        rgba(10, 11, 14, 0.98);
      box-shadow: var(--shadow-red);
      transform: translateY(-3px) scale(1.04);
    }

    .scroll-top:active {
      transform: translateY(0) scale(0.96);
    }

    .scroll-top svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    @media (max-width: 720px) {
      .scroll-top {
        right: 14px;
        bottom: calc(82px + env(safe-area-inset-bottom));
        width: 48px;
        height: 48px;
      }
    }

    @media (max-width: 390px) {
      .scroll-top {
        right: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .scroll-top,
      .scroll-top.is-visible {
        animation: none;
      }
    }

    @keyframes scrollTopIn {
      0% {
        opacity: 0;
        transform: translateY(14px) scale(0.9);
      }

      72% {
        transform: translateY(-2px) scale(1.02);
      }

      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private animationFrameId: number | null = null;
  private removeScrollListener?: () => void;

  readonly isVisible = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const onScroll = () => this.queueVisibilityUpdate();

      window.addEventListener('scroll', onScroll, { passive: true });
      this.removeScrollListener = () => window.removeEventListener('scroll', onScroll);
      this.queueVisibilityUpdate();
    });
  }

  ngOnDestroy(): void {
    this.removeScrollListener?.();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private queueVisibilityUpdate(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      const shouldShow = window.scrollY > 300;

      if (this.isVisible() !== shouldShow) {
        this.ngZone.run(() => this.isVisible.set(shouldShow));
      }
    });
  }
}
