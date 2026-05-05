import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckInService } from '../../services/check-in.service';

type CheckInFilterCriterion = 'name' | 'email' | 'date' | 'month';

@Component({
  selector: 'app-admin-check-ins',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Dolasci</p>
        <h1>Check-in evidencija</h1>
      </div>

      <div class="panel-toolbar check-in-filters">
        <label>
          Korisnik
          <input
            [ngModel]="userFilter()"
            (ngModelChange)="setUserFilter($event)"
            placeholder="Ime ili email"
          />
        </label>
        <label>
          Datum
          <input type="date" [ngModel]="dateFilter()" (ngModelChange)="dateFilter.set($event)" />
        </label>
        <label>
          Mesec
          <input type="month" [ngModel]="monthFilter()" (ngModelChange)="monthFilter.set($event)" />
        </label>
      </div>

      <div class="card check-in-mobile-filters">
        <label>
          Izaberi kriterijum
          <select
            [ngModel]="mobileFilterCriterion()"
            (ngModelChange)="onMobileFilterCriterionChange($event)"
          >
            <option value="name">Ime korisnika</option>
            <option value="email">Email</option>
            <option value="date">Datum</option>
            <option value="month">Mesec</option>
          </select>
        </label>

        @if (mobileFilterCriterion() === 'date') {
          <label>
            Datum
            <input
              type="date"
              [ngModel]="mobileFilterValue()"
              (ngModelChange)="mobileFilterValue.set($event)"
            />
          </label>
        } @else if (mobileFilterCriterion() === 'month') {
          <label>
            Mesec
            <input
              type="month"
              [ngModel]="mobileFilterValue()"
              (ngModelChange)="mobileFilterValue.set($event)"
            />
          </label>
        } @else {
          <label>
            {{ mobileFilterCriterion() === 'email' ? 'Email' : 'Ime korisnika' }}
            <input
              [ngModel]="mobileFilterValue()"
              (ngModelChange)="mobileFilterValue.set($event)"
              [placeholder]="mobileFilterCriterion() === 'email' ? 'email@primer.com' : 'Ime korisnika'"
            />
          </label>
        }

        <div class="form-actions full">
          <button class="btn btn--primary" type="button" (click)="applyMobileFilter()">
            Primeni filter
          </button>
          <button class="btn btn--ghost" type="button" (click)="resetFilters()">Resetuj</button>
        </div>
      </div>

      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Ime i prezime</th>
              <th>Email</th>
              <th>Datum</th>
              <th>Vreme</th>
            </tr>
          </thead>
          <tbody>
            @if (checkInService.isLoading()) {
              <tr>
                <td colspan="4"><span class="skeleton-line"></span></td>
              </tr>
            } @else {
              @for (checkIn of filteredCheckIns(); track checkIn.id) {
                <tr>
                  <td data-label="Ime i prezime">{{ checkIn.fullName }}</td>
                  <td data-label="Email">{{ checkIn.email }}</td>
                  <td data-label="Datum">{{ formatDate(checkIn.date) }}</td>
                  <td data-label="Vreme">{{ checkIn.time }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4">Nema dolazaka za izabrane filtere.</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCheckInsComponent {
  readonly checkInService = inject(CheckInService);
  readonly userFilter = signal('');
  readonly userFilterMode = signal<'all' | 'name' | 'email'>('all');
  readonly dateFilter = signal('');
  readonly monthFilter = signal('');
  readonly mobileFilterCriterion = signal<CheckInFilterCriterion>('name');
  readonly mobileFilterValue = signal('');

  readonly filteredCheckIns = computed(() => {
    const user = this.userFilter().trim().toLowerCase();
    const userMode = this.userFilterMode();
    const date = this.dateFilter();
    const month = this.monthFilter();

    return this.checkInService.getAllCheckIns().filter((checkIn) => {
      const fullName = checkIn.fullName.toLowerCase();
      const email = checkIn.email.toLowerCase();
      const matchesUser =
        !user ||
        (userMode === 'name' && fullName.includes(user)) ||
        (userMode === 'email' && email.includes(user)) ||
        (userMode === 'all' && (fullName.includes(user) || email.includes(user)));
      const matchesDate = !date || checkIn.date === date;
      const matchesMonth = !month || checkIn.date.startsWith(month);

      return matchesUser && matchesDate && matchesMonth;
    });
  });

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return day && month && year ? `${day}.${month}.${year}.` : value;
  }

  setUserFilter(value: string): void {
    this.userFilterMode.set('all');
    this.userFilter.set(value);
  }

  onMobileFilterCriterionChange(criterion: CheckInFilterCriterion): void {
    this.mobileFilterCriterion.set(criterion);
    this.mobileFilterValue.set('');
  }

  applyMobileFilter(): void {
    const criterion = this.mobileFilterCriterion();
    const value = this.mobileFilterValue();

    this.userFilter.set('');
    this.userFilterMode.set('all');
    this.dateFilter.set('');
    this.monthFilter.set('');

    if (criterion === 'date') {
      this.dateFilter.set(value);
      return;
    }

    if (criterion === 'month') {
      this.monthFilter.set(value);
      return;
    }

    this.userFilterMode.set(criterion);
    this.userFilter.set(value);
  }

  resetFilters(): void {
    this.userFilter.set('');
    this.userFilterMode.set('all');
    this.dateFilter.set('');
    this.monthFilter.set('');
    this.mobileFilterValue.set('');
  }
}
