import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MembershipApplication } from '../../models/membership-application.model';
import { AuthService } from '../../services/auth.service';
import { MembershipApplicationService } from '../../services/membership-application.service';

type MembershipDisplayStatus = 'active' | 'expiring' | 'expired';

interface MembershipViewModel {
  application: MembershipApplication;
  startDate: Date | null;
  endDate: Date | null;
  statusLabel: string;
  statusClass: string;
  expirationText: string;
  sortTime: number;
}

@Component({
  selector: 'app-user-memberships',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Moje clanarine</p>
        <h1>Prijave za pakete</h1>
      </div>

      <section class="card panel-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paket</th>
                <th>Cena</th>
                <th>Datum pocetka</th>
                <th>Datum isteka</th>
                <th>Status</th>
                <th>Datum prijave</th>
              </tr>
            </thead>
            <tbody>
              @if (membershipService.isLoading()) {
                <tr>
                  <td colspan="6"><span class="skeleton-line"></span></td>
                </tr>
              } @else {
                @for (membership of myMemberships(); track membership.application.id) {
                  <tr>
                    <td data-label="Paket">{{ membership.application.packageName }}</td>
                    <td data-label="Cena">{{ membership.application.packagePrice }}</td>
                    <td data-label="Datum pocetka">
                      {{ membership.startDate ? (membership.startDate | date: 'dd.MM.yyyy') : '-' }}
                    </td>
                    <td data-label="Datum isteka">
                      {{ membership.endDate ? (membership.endDate | date: 'dd.MM.yyyy') : '-' }}
                    </td>
                    <td data-label="Status">
                      <span class="status-badge {{ membership.statusClass }}">
                        {{ membership.statusLabel }}
                      </span>
                      <p>{{ membership.expirationText }}</p>
                    </td>
                    <td data-label="Datum prijave">
                      {{ membership.application.createdAt | date: 'short' }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6">Nemate aktivnu clanarinu</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        <a class="btn btn--primary" href="/#pricing">Pogledaj pakete</a>
        <a class="btn btn--ghost" href="/#pricing">Produzi clanarinu</a>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMembershipsComponent {
  readonly authService = inject(AuthService);
  readonly membershipService = inject(MembershipApplicationService);

  readonly myApplications = computed(() => {
    const user = this.authService.currentUser();

    return user ? this.membershipService.getApplicationsByUserId(user.id, user.email) : [];
  });

  readonly myMemberships = computed(() =>
    this.myApplications()
      .map((application) => this.toMembershipViewModel(application))
      .sort((a, b) => {
        const activeOrder =
          Number(this.isActiveStatus(b.statusLabel)) - Number(this.isActiveStatus(a.statusLabel));

        return activeOrder || b.sortTime - a.sortTime;
      }),
  );

  private toMembershipViewModel(application: MembershipApplication): MembershipViewModel {
    const startDate = this.parseDate(application.startDate || application.createdAt);
    const endDate = startDate ? this.addOneMonth(startDate) : null;
    const status = this.getDisplayStatus(endDate);

    return {
      application,
      startDate,
      endDate,
      statusLabel: this.getStatusLabel(status),
      statusClass: `status-badge--${status}`,
      expirationText: this.getExpirationText(endDate),
      sortTime: startDate?.getTime() ?? 0,
    };
  }

  private getDisplayStatus(endDate: Date | null): MembershipDisplayStatus {
    if (!endDate) {
      return 'expired';
    }

    const today = this.startOfDay(new Date());
    const expirationDate = this.startOfDay(endDate);
    const daysUntilExpiration =
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiration < 0) {
      return 'expired';
    }

    return daysUntilExpiration < 5 ? 'expiring' : 'active';
  }

  private getStatusLabel(status: MembershipDisplayStatus): string {
    if (status === 'expiring') {
      return 'Istice uskoro';
    }

    return status === 'active' ? 'Aktivna' : 'Istekla';
  }

  private getExpirationText(endDate: Date | null): string {
    if (!endDate) {
      return 'Datum isteka nije dostupan.';
    }

    const daysLeft =
      (this.startOfDay(endDate).getTime() - this.startOfDay(new Date()).getTime()) /
      (1000 * 60 * 60 * 24);

    return daysLeft >= 0
      ? `Clanarina istice za ${Math.ceil(daysLeft)} dana.`
      : `Clanarina je istekla pre ${Math.abs(Math.floor(daysLeft))} dana.`;
  }

  private isActiveStatus(statusLabel: string): boolean {
    return statusLabel === 'Aktivna' || statusLabel === 'Istice uskoro';
  }

  private addOneMonth(date: Date): Date {
    const endDate = new Date(date);

    endDate.setMonth(endDate.getMonth() + 1);

    return endDate;
  }

  private parseDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;

      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(date: Date): Date {
    const start = new Date(date);

    start.setHours(0, 0, 0, 0);

    return start;
  }
}
