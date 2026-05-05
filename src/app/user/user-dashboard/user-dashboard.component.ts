import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MembershipApplication,
  getMembershipStatusClass,
  getMembershipStatusLabel,
  normalizeMembershipStatus,
} from '../../models/membership-application.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { CheckInService } from '../../services/check-in.service';
import { MembershipApplicationService } from '../../services/membership-application.service';
import { NotificationService } from '../../services/notification.service';
import { ScrollService } from '../../services/scroll.service';
import { UserGoalService } from '../../services/user-goal.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Dashboard</p>
        <h1>Zdravo, {{ authService.currentUser()?.fullName }}</h1>
      </div>

      <div class="panel-grid two">
        <section class="card panel-card">
          <h2>Moji podaci</h2>
          <p><strong>Ime:</strong> {{ authService.currentUser()?.fullName || 'Nije uneseno' }}</p>
          <p><strong>Email:</strong> {{ authService.currentUser()?.email || 'Nije unet' }}</p>
          <p><strong>Telefon:</strong> {{ authService.currentUser()?.phone || 'Nije unet' }}</p>
          <a class="btn btn--ghost" routerLink="/user/profile">Uredi profil</a>
        </section>

        <section class="card panel-card">
          <h2>Status clanarine</h2>
          @if (membershipService.isLoading()) {
            <span class="skeleton-line"></span>
          } @else if (latestMembership(); as membership) {
            <p>
              <strong>Status:</strong>
              <span class="status-badge {{ membership.statusClass }}">
                {{ membership.statusLabel }}
              </span>
            </p>
            <p><strong>Pocetak:</strong> {{ membership.startDate | date: 'dd.MM.yyyy' }}</p>
            <p><strong>Istice:</strong> {{ membership.endDate | date: 'dd.MM.yyyy' }}</p>
            <p>{{ membership.expirationText }}</p>
          } @else {
            <p class="empty-state">Nemas evidentiranu clanarinu.</p>
            <a class="btn btn--primary" href="/#pricing" (click)="scrollService.goToSection('pricing', $event)">Pogledaj pakete</a>
          }
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

        <section class="card panel-card">
          <h2>Mesecni cilj</h2>
          <p>
            <strong>Napredak:</strong> {{ monthlyCheckIns().length }}/{{ monthlyGoal() }}
            dolazaka
          </p>
          <div class="progress-meter" aria-label="Napredak ka mesecnom cilju">
            <span [style.width.%]="goalProgress()"></span>
          </div>
          <p>{{ goalProgressText() }}</p>
          <a class="btn btn--ghost" routerLink="/user/progress">Podesi cilj</a>
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
              @for (booking of latestBookings(); track booking.id) {
                <tr>
                  <td data-label="Trener">
                    {{ displayTrainer(booking.trainerName, booking.message) }}
                  </td>
                  <td data-label="Datum">{{ booking.preferredDate || '-' }}</td>
                  <td data-label="Vreme">{{ booking.preferredTime || '-' }}</td>
                  <td data-label="Status">
                    <span class="status-badge status-badge--neutral">{{ booking.status }}</span>
                  </td>
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

      <section class="card panel-card">
        <h2>Notifikacije</h2>
        @if (notificationService.isLoading()) {
          <span class="skeleton-line"></span>
        } @else {
          <div class="notification-list">
            @for (
              notification of latestNotifications();
              track notification.id
            ) {
              <article class="notification-item" [class.is-unread]="!notification.read">
                <span class="status-badge status-badge--neutral">
                  {{ notification.read ? 'Procitano' : 'Novo' }}
                </span>
                <p>{{ notification.message }}</p>
                <small>{{ notification.createdAt | date: 'short' }}</small>
              </article>
            } @empty {
              <p class="empty-state">Trenutno nema notifikacija.</p>
            }
          </div>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent {
  readonly authService = inject(AuthService);
  readonly membershipService = inject(MembershipApplicationService);
  readonly notificationService = inject(NotificationService);
  readonly scrollService = inject(ScrollService);
  private readonly bookingService = inject(BookingService);
  private readonly checkInService = inject(CheckInService);
  private readonly goalService = inject(UserGoalService);

  readonly myBookings = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return this.bookingService.bookings().filter((booking) => booking.userId === userId);
  });

  readonly latestBookings = computed(() => this.myBookings().slice(0, 5));

  readonly latestNotifications = computed(() => this.notificationService.notifications().slice(0, 4));

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

  readonly currentGoal = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.goalService.getCurrentMonthGoal(userId) : undefined;
  });

  readonly monthlyGoal = computed(() => this.currentGoal()?.monthlyGoal || 12);

  readonly goalProgress = computed(() =>
    Math.min(100, Math.round((this.monthlyCheckIns().length / this.monthlyGoal()) * 100)),
  );

  readonly goalProgressText = computed(() => {
    const remaining = this.monthlyGoal() - this.monthlyCheckIns().length;

    return remaining > 0
      ? `Jos ${remaining} dolazaka do mesecnog cilja.`
      : 'Mesecni cilj je ispunjen.';
  });

  readonly latestMembership = computed(() => {
    const user = this.authService.currentUser();
    const application = user
      ? this.membershipService.getApplicationsByUserId(user.id, user.email)[0]
      : undefined;

    return application ? this.toMembershipView(application) : undefined;
  });

  displayTrainer(trainerName?: string, message = ''): string {
    return trainerName || message.match(/^Izabrani trener: ([^|]+)/)?.[1]?.trim() || '-';
  }

  private toMembershipView(application: MembershipApplication): {
    startDate: Date;
    endDate: Date;
    statusClass: string;
    statusLabel: string;
    expirationText: string;
  } {
    const startDate = this.parseDate(application.startDate || application.createdAt) ?? new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const status = normalizeMembershipStatus(application.status);
    const daysLeft = Math.ceil(
      (this.startOfDay(endDate).getTime() - this.startOfDay(new Date()).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      startDate,
      endDate,
      statusClass: getMembershipStatusClass(application.status),
      statusLabel: getMembershipStatusLabel(application.status),
      expirationText: this.getMembershipText(status, daysLeft),
    };
  }

  private getMembershipText(status: string, daysLeft: number): string {
    if (status === 'na_cekanju') {
      return 'Zahtev je u obradi.';
    }

    if (status === 'blokirano') {
      return 'Clanarina je blokirana.';
    }

    return daysLeft >= 0
      ? `Clanarina istice za ${daysLeft} dana.`
      : `Clanarina je istekla pre ${Math.abs(daysLeft)} dana.`;
  }

  private parseDate(value: string): Date | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(date: Date): Date {
    const nextDate = new Date(date);
    nextDate.setHours(0, 0, 0, 0);

    return nextDate;
  }
}
