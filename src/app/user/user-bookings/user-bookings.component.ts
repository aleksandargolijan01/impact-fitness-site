import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { TrainerService } from '../../services/trainer.service';

@Component({
  selector: 'app-user-bookings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Moji zahtevi</p>
        <h1>Posalji zahtev treneru</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <form class="card panel-form" [formGroup]="form" (ngSubmit)="save()">
        <label>
          Izaberi trenera
          <select formControlName="trainerId">
            <option value="">Izaberi trenera</option>
            <option value="no-preference">Nije bitno - predlozite mi trenera</option>
            @for (trainer of trainerService.trainers(); track trainer.id) {
              <option [value]="trainer.id">{{ trainer.name }}</option>
            }
          </select>
        </label>
        <label>Zeljeni datum <input type="date" formControlName="preferredDate" /></label>
        <label>Zeljeno vreme <input type="time" formControlName="preferredTime" /></label>
        <label>Cilj treninga <input formControlName="goal" /></label>
        <label class="full"
          >Dodatna poruka <textarea rows="4" formControlName="message"></textarea>
        </label>
        <button class="btn btn--primary full" type="submit" [disabled]="isSaving()">
          {{ isSaving() ? 'Cuvanje...' : 'Posalji zahtev' }}
        </button>
      </form>

      <section class="card panel-card">
        <h2>Moji zahtevi</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
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
                  <td colspan="6"><span class="skeleton-line"></span></td>
                </tr>
              } @else {
                @for (booking of myBookings(); track booking.id) {
                  <tr>
                    <td data-label="Trener">
                      {{ displayTrainer(booking.trainerName, booking.message) }}
                    </td>
                    <td data-label="Datum">{{ booking.preferredDate }}</td>
                    <td data-label="Vreme">{{ booking.preferredTime }}</td>
                    <td data-label="Cilj">{{ booking.goal }}</td>
                    <td data-label="Status">{{ booking.status }}</td>
                    <td class="row-actions" data-label="Akcije">
                      @if (booking.status !== 'otkazano') {
                        <button class="btn btn--ghost" type="button" (click)="cancel(booking.id)">
                          Otkazi
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6">Jos nemas zahteve.</td>
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
export class UserBookingsComponent {
  readonly authService = inject(AuthService);
  readonly trainerService = inject(TrainerService);
  readonly bookingService = inject(BookingService);
  private readonly fb = inject(FormBuilder);
  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    trainerId: ['', Validators.required],
    preferredDate: ['', Validators.required],
    preferredTime: ['', Validators.required],
    goal: ['', Validators.required],
    message: [''],
  });

  readonly myBookings = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return this.bookingService.bookings().filter((booking) => booking.userId === userId);
  });

  displayTrainer(trainerName?: string, message = ''): string {
    return trainerName || message.match(/^Izabrani trener: ([^|]+)/)?.[1]?.trim() || '-';
  }

  async save(): Promise<void> {
    const user = this.authService.currentUser();

    if (!user || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.bookingService.createBooking({
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        goal: raw.goal,
        serviceType: 'Zahtev treneru',
        trainerId: raw.trainerId,
        trainerName: this.getTrainerName(raw.trainerId),
        message: raw.message,
        preferredDate: raw.preferredDate,
        preferredTime: raw.preferredTime,
        userId: user.id,
        source: 'user',
      });

      this.form.reset({
        trainerId: '',
        preferredDate: '',
        preferredTime: '',
        goal: '',
        message: '',
      });
      this.successMessage.set('Zahtev je sacuvan.');
    } catch (error) {
      console.error('Creating user booking failed', error);
      this.errorMessage.set(
        'Zahtev trenutno nije sacuvan. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async cancel(bookingId: string): Promise<void> {
    const user = this.authService.currentUser();

    if (!user) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.bookingService.cancelBooking(bookingId, user.id);
      this.successMessage.set('Zahtev je otkazan.');
    } catch (error) {
      console.error('Cancelling user booking failed', error);
      this.errorMessage.set(
        'Zahtev trenutno nije otkazan. Proveri Firebase rules i pokusaj ponovo.',
      );
    }
  }

  private getTrainerName(trainerId: string): string {
    if (trainerId === 'no-preference') {
      return 'Nije bitno - predlozite mi trenera';
    }

    return (
      this.trainerService.trainers().find((trainer) => trainer.id === trainerId)?.name ??
      'Nije bitno - predlozite mi trenera'
    );
  }
}
