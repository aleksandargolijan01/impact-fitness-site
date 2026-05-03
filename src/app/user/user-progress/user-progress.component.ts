import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MembershipApplication } from '../../models/membership-application.model';
import { AuthService } from '../../services/auth.service';
import { CheckInService } from '../../services/check-in.service';
import { MembershipApplicationService } from '../../services/membership-application.service';
import { NotificationService } from '../../services/notification.service';
import { ScrollService } from '../../services/scroll.service';
import { UserGoalService } from '../../services/user-goal.service';

@Component({
  selector: 'app-user-progress',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Moj napredak</p>
        <h1>Moja statistika</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <div class="panel-grid two">
        <section class="card panel-card">
          <h2>Dolasci</h2>
          <p><strong>Ukupno dolazaka:</strong> {{ myCheckIns().length }}</p>
          <p><strong>Ovaj mesec:</strong> {{ monthlyCheckIns().length }}</p>
          <p><strong>Poslednji dolazak:</strong> {{ lastCheckInLabel() }}</p>
          <p><strong>Najaktivniji dan:</strong> {{ mostActiveDay() }}</p>
          <a class="btn btn--primary" routerLink="/user/check-in">Cekiraj se</a>
        </section>

        <section class="card panel-card">
          <h2>Mesecni cilj</h2>
          <p><strong>Cilj:</strong> {{ currentGoal()?.monthlyGoal || selectedGoal() }} dolazaka</p>
          <p>
            <strong>Trenutno:</strong>
            {{ monthlyCheckIns().length }}/{{ currentGoal()?.monthlyGoal || selectedGoal() }}
          </p>
          <div class="progress-meter" aria-label="Napredak ka mesecnom cilju">
            <span [style.width.%]="goalProgress()"></span>
          </div>
          <p>{{ goalProgressText() }}</p>
          <label>
            Izaberi cilj
            <select [ngModel]="selectedGoal()" (ngModelChange)="selectedGoal.set($event)">
              <option [ngValue]="8">8 dolazaka</option>
              <option [ngValue]="12">12 dolazaka</option>
              <option [ngValue]="16">16 dolazaka</option>
            </select>
          </label>
          <button class="btn btn--primary" type="button" (click)="saveGoal()">Sacuvaj cilj</button>
        </section>
      </div>

      <section class="card panel-card">
        <h2>Status clanarine</h2>
        @if (latestMembership(); as membership) {
          <p><strong>Datum pocetka:</strong> {{ membership.startDate | date: 'dd.MM.yyyy' }}</p>
          <p><strong>Datum isteka:</strong> {{ membership.endDate | date: 'dd.MM.yyyy' }}</p>
          <p>
            <strong>Status:</strong>
            <span class="status-badge {{ membership.statusClass }}">{{
              membership.statusLabel
            }}</span>
          </p>
          <p>{{ membership.expirationText }}</p>
          <a class="btn btn--ghost" href="/#pricing" (click)="scrollService.goToSection('pricing', $event)">Produzi clanarinu</a>
        } @else {
          <p>Nemate aktivnu clanarinu.</p>
          <a class="btn btn--primary" href="/#pricing" (click)="scrollService.goToSection('pricing', $event)">Pogledaj pakete</a>
        }
      </section>

      <section class="card panel-card">
        <h2>Obavestenja</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Poruka</th>
                <th>Tip</th>
                <th>Datum</th>
              </tr>
            </thead>
            <tbody>
              @if (notificationService.isLoading()) {
                <tr>
                  <td colspan="3"><span class="skeleton-line"></span></td>
                </tr>
              } @else {
                @for (notification of notificationService.notifications(); track notification.id) {
                  <tr [class.is-unread]="!notification.read">
                    <td data-label="Poruka">{{ notification.message }}</td>
                    <td data-label="Tip">
                      <span class="status-badge status-badge--neutral">
                        {{ notification.read ? 'Procitano' : 'Novo' }}
                      </span>
                    </td>
                    <td data-label="Datum">{{ notification.createdAt | date: 'short' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3">Trenutno nema obavestenja.</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProgressComponent {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  readonly scrollService = inject(ScrollService);
  private readonly checkInService = inject(CheckInService);
  private readonly goalService = inject(UserGoalService);
  private readonly membershipService = inject(MembershipApplicationService);

  readonly selectedGoal = signal(12);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      const savedGoal = this.currentGoal()?.monthlyGoal;

      if (savedGoal) {
        this.selectedGoal.set(savedGoal);
      }
    });
  }

  readonly myCheckIns = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.checkInService.getCheckInsByUserId(userId) : [];
  });

  readonly monthlyCheckIns = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.checkInService.getMonthlyCheckInsByUserId(userId) : [];
  });

  readonly currentGoal = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.goalService.getCurrentMonthGoal(userId) : undefined;
  });

  readonly lastCheckInLabel = computed(() =>
    this.checkInService.formatCheckIn(this.myCheckIns()[0]),
  );
  readonly goalProgress = computed(() => {
    const goal = this.currentGoal()?.monthlyGoal || this.selectedGoal();

    return Math.min(100, Math.round((this.monthlyCheckIns().length / goal) * 100));
  });
  readonly goalProgressText = computed(() => {
    const goal = this.currentGoal()?.monthlyGoal || this.selectedGoal();
    const remaining = goal - this.monthlyCheckIns().length;

    return remaining > 0
      ? `Jos ${remaining} dolazaka do mesecnog cilja.`
      : 'Mesecni cilj je ispunjen.';
  });
  readonly mostActiveDay = computed(() => this.getMostActiveDay());
  readonly latestMembership = computed(() => {
    const user = this.authService.currentUser();
    const application = user
      ? this.membershipService.getApplicationsByUserId(user.id, user.email)[0]
      : undefined;

    return application ? this.toMembershipView(application) : undefined;
  });

  async saveGoal(): Promise<void> {
    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.goalService.saveMonthlyGoal(userId, Number(this.selectedGoal()));
      this.successMessage.set('Cilj je sacuvan.');
    } catch (error) {
      console.error('Saving monthly goal failed', error);
      this.errorMessage.set('Cilj trenutno nije sacuvan. Pokusajte ponovo.');
    }
  }

  private getMostActiveDay(): string {
    const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Cetvrtak', 'Petak', 'Subota'];
    const counts = new Map<number, number>();

    this.myCheckIns().forEach((checkIn) => {
      const day = new Date(`${checkIn.date}T${checkIn.time || '00:00'}`).getDay();
      counts.set(day, (counts.get(day) ?? 0) + 1);
    });

    const [day] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

    return day === undefined ? '-' : dayNames[day];
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
    const daysLeft = Math.ceil(
      (this.startOfDay(endDate).getTime() - this.startOfDay(new Date()).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const status = daysLeft < 0 ? 'expired' : daysLeft < 5 ? 'expiring' : 'active';

    return {
      startDate,
      endDate,
      statusClass: `status-badge--${status}`,
      statusLabel:
        status === 'active' ? 'Aktivna' : status === 'expiring' ? 'Istice uskoro' : 'Istekla',
      expirationText:
        daysLeft >= 0
          ? `Clanarina istice za ${daysLeft} dana.`
          : `Clanarina je istekla pre ${Math.abs(daysLeft)} dana.`,
    };
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
