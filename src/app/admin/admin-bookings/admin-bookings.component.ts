import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingStatus } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Zahtevi</p>
        <h1>Pregled i statusi</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <div class="panel-toolbar">
        <label>
          Filter po statusu
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
            <option value="sve">Sve</option>
            <option value="novo">Novo</option>
            <option value="kontaktirano">Kontaktirano</option>
            <option value="zavrseno">Zavrseno</option>
            <option value="otkazano">Otkazano</option>
          </select>
        </label>
      </div>

      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Korisnik</th>
              <th>Trener</th>
              <th>Datum</th>
              <th>Vreme</th>
              <th>Cilj</th>
              <th>Status</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            @if (bookingService.isLoading()) {
              <tr>
                <td colspan="7"><span class="skeleton-line"></span></td>
              </tr>
            } @else {
              @for (booking of filteredBookings(); track booking.id) {
                <tr>
                  <td data-label="Korisnik">
                    {{ booking.fullName }}<br />{{ booking.phone }}<br />{{ booking.email }}
                  </td>
                  <td data-label="Trener">
                    {{ displayTrainer(booking.trainerName, booking.message) }}
                  </td>
                  <td data-label="Datum">
                    {{
                      booking.preferredDate || booking.date || (booking.submittedAt | date: 'short')
                    }}
                  </td>
                  <td data-label="Vreme">{{ booking.preferredTime || '-' }}</td>
                  <td data-label="Cilj">{{ booking.goal }}</td>
                  <td data-label="Status">
                    <select
                      [ngModel]="booking.status"
                      (ngModelChange)="updateStatus(booking.id, $event)"
                    >
                      <option value="novo">Novo</option>
                      <option value="kontaktirano">Kontaktirano</option>
                      <option value="zavrseno">Zavrseno</option>
                      <option value="otkazano">Otkazano</option>
                    </select>
                  </td>
                  <td data-label="Akcije">
                    <button class="btn btn--ghost" type="button" (click)="delete(booking.id)">
                      Obrisi
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">Nema prijava za izabrani status.</td>
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
export class AdminBookingsComponent {
  readonly bookingService = inject(BookingService);
  readonly statusFilter = signal<BookingStatus | 'sve'>('sve');
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly filteredBookings = computed(() => {
    const status = this.statusFilter();

    if (status === 'sve') {
      return this.bookingService.bookings();
    }

    return this.bookingService.bookings().filter((booking) => booking.status === status);
  });

  displayTrainer(trainerName?: string, message = ''): string {
    return trainerName || message.match(/^Izabrani trener: ([^|]+)/)?.[1]?.trim() || '-';
  }

  async updateStatus(bookingId: string, status: BookingStatus): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.bookingService.updateStatus(bookingId, status);
      this.successMessage.set('Status zahteva je sacuvan.');
    } catch (error) {
      console.error('Updating booking status failed', error);
      this.errorMessage.set(
        'Status trenutno nije sacuvan. Proveri Firebase rules i pokusaj ponovo.',
      );
    }
  }

  async delete(bookingId: string): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.bookingService.deleteBooking(bookingId);
      this.successMessage.set('Zahtev je obrisan.');
    } catch (error) {
      console.error('Deleting booking failed', error);
      this.errorMessage.set(
        'Zahtev trenutno nije obrisan. Proveri Firebase rules i pokusaj ponovo.',
      );
    }
  }
}
