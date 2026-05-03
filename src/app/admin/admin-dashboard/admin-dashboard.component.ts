import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { GymService } from '../../services/gym.service';
import { PricingService } from '../../services/pricing.service';
import { TrainerService } from '../../services/trainer.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Dashboard</p>
        <h1>Pregled poslovanja</h1>
      </div>

      <div class="stat-grid">
        <article class="card stat-card">
          <span>Zahtevi</span>
          <strong>{{ bookingService.bookings().length }}</strong>
        </article>
        <article class="card stat-card">
          <span>Korisnici</span>
          <strong>{{ authService.users().length }}</strong>
        </article>
        <article class="card stat-card">
          <span>Treneri</span>
          <strong>{{ trainerService.trainers().length }}</strong>
        </article>
        <article class="card stat-card">
          <span>Usluge</span>
          <strong>{{ gymService.services().length }}</strong>
        </article>
      </div>

      <div class="panel-grid two">
        <section class="card panel-card">
          <h2>Poslednje prijave</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ime</th>
                  <th>Trener</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (booking of latestBookings(); track booking.id) {
                  <tr>
                    <td data-label="Ime">{{ booking.fullName }}</td>
                    <td data-label="Trener">
                      {{
                        displayTrainer(booking.trainerName, booking.message, booking.serviceType)
                      }}
                    </td>
                    <td data-label="Status">{{ booking.status }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3">Jos nema prijava.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card panel-card">
          <h2>Brzi linkovi</h2>
          <div class="quick-links">
            <a class="btn btn--ghost" routerLink="/admin/pricing">Uredi cenovnik</a>
            <a class="btn btn--ghost" routerLink="/admin/trainers">Uredi trenere</a>
            <a class="btn btn--ghost" routerLink="/admin/services">Uredi usluge</a>
            <a class="btn btn--ghost" routerLink="/admin/gallery">Uredi galeriju</a>
            <a class="btn btn--ghost" routerLink="/admin/users">Pregled korisnika</a>
            <a class="btn btn--ghost" routerLink="/admin/check-ins">Pregled dolazaka</a>
            <a class="btn btn--primary" routerLink="/admin/bookings">Pregled zahteva</a>
          </div>
        </section>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  readonly authService = inject(AuthService);
  readonly bookingService = inject(BookingService);
  readonly trainerService = inject(TrainerService);
  readonly gymService = inject(GymService);
  readonly pricingService = inject(PricingService);

  readonly latestBookings = computed(() => this.bookingService.bookings().slice(0, 5));

  displayTrainer(trainerName?: string, message = '', fallback = ''): string {
    return trainerName || message.match(/^Izabrani trener: ([^|]+)/)?.[1]?.trim() || fallback;
  }
}
