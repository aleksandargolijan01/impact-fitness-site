import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { CheckInService } from '../../services/check-in.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Dashboard</p>
        <h1>Zdravo, {{ authService.currentUser()?.fullName }}</h1>
      </div>

      <div class="panel-grid two">
        <section class="card panel-card">
          <h2>Moji podaci</h2>
          <p><strong>Email:</strong> {{ authService.currentUser()?.email }}</p>
          <p><strong>Telefon:</strong> {{ authService.currentUser()?.phone }}</p>
          <a class="btn btn--ghost" routerLink="/user/profile">Uredi profil</a>
        </section>

        <section class="card panel-card">
          <h2>Moji zahtevi</h2>
          <strong class="big-number">{{ myBookings().length }}</strong>
          <a class="btn btn--primary" routerLink="/user/bookings">Novi zahtev</a>
        </section>

        <section class="card panel-card">
          <h2>Moji dolasci</h2>
          <p><strong>Ukupno dolazaka:</strong> {{ myCheckIns().length }}</p>
          <p><strong>Ovaj mesec:</strong> {{ monthlyCheckIns().length }}</p>
          <p><strong>Poslednji dolazak:</strong> {{ lastCheckInLabel() }}</p>
          <div class="form-actions full">
            <a class="btn btn--primary" routerLink="/user/check-in">Cekiraj se</a>
            <a class="btn btn--ghost" routerLink="/user/progress">Moj napredak</a>
          </div>
        </section>
      </div>

      <section class="card panel-card">
        <h2>Moji poslednji zahtevi</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trener</th>
                <th>Datum</th>
                <th>Vreme</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (booking of myBookings().slice(0, 5); track booking.id) {
                <tr>
                  <td data-label="Trener">
                    {{ displayTrainer(booking.trainerName, booking.message) }}
                  </td>
                  <td data-label="Datum">{{ booking.preferredDate || '-' }}</td>
                  <td data-label="Vreme">{{ booking.preferredTime || '-' }}</td>
                  <td data-label="Status">{{ booking.status }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">Jos nemas zahteve.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent {
  readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly checkInService = inject(CheckInService);

  readonly myBookings = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return this.bookingService.bookings().filter((booking) => booking.userId === userId);
  });

  readonly myCheckIns = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.checkInService.getCheckInsByUserId(userId) : [];
  });

  readonly monthlyCheckIns = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.checkInService.getMonthlyCheckInsByUserId(userId) : [];
  });

  readonly lastCheckInLabel = computed(() =>
    this.checkInService.formatCheckIn(this.myCheckIns()[0]),
  );

  displayTrainer(trainerName?: string, message = ''): string {
    return trainerName || message.match(/^Izabrani trener: ([^|]+)/)?.[1]?.trim() || '-';
  }
}
