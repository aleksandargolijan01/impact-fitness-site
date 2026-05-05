import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="panel-shell">
      <aside class="panel-sidebar">
        <a class="panel-brand" routerLink="/admin/dashboard">
          <span class="brand-mark">IF</span>
          <span>Admin</span>
        </a>
        <nav>
          <a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/admin/pricing" routerLinkActive="active">Cenovnik</a>
          <a routerLink="/admin/trainers" routerLinkActive="active">Treneri</a>
          <a routerLink="/admin/services" routerLinkActive="active">Usluge</a>
          <a routerLink="/admin/gallery" routerLinkActive="active">Galerija</a>
          <a routerLink="/admin/bookings" routerLinkActive="active">Zahtevi</a>
          <a routerLink="/admin/memberships" routerLinkActive="active">Clanarine</a>
          <a routerLink="/admin/check-ins" routerLinkActive="active">Dolasci</a>
          <a routerLink="/admin/users" routerLinkActive="active">Korisnici</a>
        </nav>
      </aside>

      <section class="panel-main">
        <header class="panel-topbar">
          <div>
            <p class="section-kicker">Firebase admin</p>
            <strong>Impact Fitness admin panel</strong>
          </div>
          <div class="panel-actions">
            <a class="btn btn--ghost" routerLink="/">Javni sajt</a>
            <button class="btn btn--primary" type="button" (click)="logout()">Logout</button>
          </div>
        </header>
        <router-outlet></router-outlet>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
