import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckInService } from '../../services/check-in.service';

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
            (ngModelChange)="userFilter.set($event)"
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
  readonly dateFilter = signal('');
  readonly monthFilter = signal('');

  readonly filteredCheckIns = computed(() => {
    const user = this.userFilter().trim().toLowerCase();
    const date = this.dateFilter();
    const month = this.monthFilter();

    return this.checkInService.getAllCheckIns().filter((checkIn) => {
      const matchesUser =
        !user ||
        checkIn.fullName.toLowerCase().includes(user) ||
        checkIn.email.toLowerCase().includes(user);
      const matchesDate = !date || checkIn.date === date;
      const matchesMonth = !month || checkIn.date.startsWith(month);

      return matchesUser && matchesDate && matchesMonth;
    });
  });

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return day && month && year ? `${day}.${month}.${year}.` : value;
  }
}
