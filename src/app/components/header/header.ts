import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnDestroy {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  readonly navItems: NavItem[] = [
    { id: 'about', label: 'O nama' },
    { id: 'services', label: 'Treninzi' },
    { id: 'pricing', label: 'Cenovnik' },
    { id: 'trainers', label: 'Treneri' },
    { id: 'contact', label: 'Kontakt' },
  ];

  readonly activeSection = signal('hero');
  readonly isMenuOpen = signal(false);
  readonly isScrolled = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    afterNextRender(() => {
      this.updateScrolledState();
      this.observeSections();
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrolledState();
  }

  toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  scrollToSection(sectionId: string, event?: Event): void {
    event?.preventDefault();

    const section = this.document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection.set(sectionId);
    }

    this.closeMenu();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.closeMenu();
    this.router.navigateByUrl('/');
  }

  private updateScrolledState(): void {
    this.isScrolled.set(globalThis.scrollY > 8);
  }

  private observeSections(): void {
    const sectionIds = ['hero', ...this.navItems.map((item) => item.id), 'booking'];
    const sections = sectionIds
      .map((id) => this.document.getElementById(id))
      .filter((section): section is HTMLElement => !!section);

    this.observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          this.activeSection.set(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-28% 0px -58% 0px',
        threshold: [0.08, 0.2, 0.4, 0.6],
      },
    );

    sections.forEach((section) => this.observer?.observe(section));
  }
}
