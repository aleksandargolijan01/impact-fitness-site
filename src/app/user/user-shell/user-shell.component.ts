import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="panel-shell user-shell">
      <aside class="panel-sidebar">
        <a class="panel-brand" routerLink="/user/dashboard">
          <span class="brand-mark">IF</span>
          <span>Moj nalog</span>
        </a>
        <nav>
          <a routerLink="/user/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/user/check-in" routerLinkActive="active">Cekiraj se</a>
          <a routerLink="/user/progress" routerLinkActive="active">Napredak</a>
          <a routerLink="/user/bookings" routerLinkActive="active">Moji zahtevi</a>
          <a routerLink="/user/memberships" routerLinkActive="active">Moje clanarine</a>
          <a routerLink="/user/profile" routerLinkActive="active">Profil</a>
        </nav>
      </aside>

      <section class="panel-main">
        <header class="panel-topbar">
          <strong>{{ authService.currentUser()?.fullName }}</strong>
          <div class="panel-actions">
            <a class="btn btn--ghost" routerLink="/">Javni sajt</a>
            <button class="btn btn--primary" type="button" (click)="logout()">Logout</button>
          </div>
        </header>
        <router-outlet></router-outlet>
      </section>

      <nav class="mobile-bottom-nav" aria-label="Korisnicka navigacija">
        <a routerLink="/user/dashboard" routerLinkActive="active">Home</a>
        <a routerLink="/user/check-in" routerLinkActive="active">Check-in</a>
        <a routerLink="/user/progress" routerLinkActive="active">Napred.</a>
        <a routerLink="/user/bookings" routerLinkActive="active">Zahtevi</a>
        <a routerLink="/user/memberships" routerLinkActive="active">Clanar.</a>
        <a routerLink="/user/profile" routerLinkActive="active">Profil</a>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserShellComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
