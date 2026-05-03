import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { where } from '@angular/fire/firestore';
import { Booking, BookingStatus } from '../models/booking.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionService } from './firestore-collection.service';

export interface CreateBookingPayload {
  fullName: string;
  phone: string;
  email: string;
  goal: string;
  serviceType: string;
  trainerId?: string;
  trainerName?: string;
  message: string;
  userId?: string;
  preferredDate?: string;
  preferredTime?: string;
  source: 'public' | 'user';
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly collectionPath = 'bookings';
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly bookingsState = signal<Booking[]>([]);
  private readonly loadingState = signal(false);

  readonly bookings = computed(() => this.bookingsState());
  readonly isLoading = computed(() => this.loadingState());

  constructor() {
    effect((onCleanup) => {
      const user = this.authService.currentUser();

      this.bookingsState.set([]);

      if (!user) {
        this.loadingState.set(false);
        return;
      }

      this.loadingState.set(true);
      const bookings$ =
        user.role === 'admin'
          ? this.firestore.listen<Booking>(this.collectionPath)
          : this.firestore.listenWhere<Booking>(
              this.collectionPath,
              where('userId', '==', user.id),
            );

      const subscription = bookings$.subscribe({
        next: (bookings) => {
          this.bookingsState.set(
            bookings.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')),
          );
          this.loadingState.set(false);
        },
        error: (error) => {
          console.error('Failed to load bookings from Firestore', error);
          this.bookingsState.set([]);
          this.loadingState.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  async createBooking(payload: CreateBookingPayload): Promise<void> {
    const submittedAt = new Date().toISOString();
    const booking: Booking = {
      id: this.firestore.createId(this.collectionPath),
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      goal: payload.goal.trim(),
      serviceType: payload.serviceType.trim(),
      service: payload.serviceType.trim(),
      trainerId: payload.trainerId?.trim() ?? '',
      trainerName: payload.trainerName?.trim() ?? '',
      message: payload.message.trim(),
      userId: payload.userId ?? '',
      preferredDate: payload.preferredDate ?? '',
      preferredTime: payload.preferredTime ?? '',
      date: payload.preferredDate || submittedAt,
      time: payload.preferredTime ?? '',
      createdAt: submittedAt,
      source: payload.source,
      submittedAt,
      status: 'novo',
    };

    try {
      await this.firestore.set(this.collectionPath, booking);
    } catch (error) {
      if (!this.isPermissionDenied(error)) {
        throw error;
      }

      const { createdAt: _createdAt, time: _time, ...compatibleBooking } = booking;

      try {
        await this.firestore.set(this.collectionPath, compatibleBooking);
        return;
      } catch (fallbackError) {
        if (!this.isPermissionDenied(fallbackError) || !compatibleBooking.trainerName) {
          throw fallbackError;
        }
      }

      const { trainerId: _trainerId, trainerName, ...legacyBooking } = compatibleBooking;

      await this.firestore.set(this.collectionPath, {
        ...legacyBooking,
        message: this.withTrainerNote(legacyBooking.message, trainerName),
      });
    }
  }

  async updateStatus(bookingId: string, status: BookingStatus): Promise<void> {
    const booking = this.bookingsState().find((item) => item.id === bookingId);

    if (booking) {
      await this.firestore.update(this.collectionPath, { ...booking, status });
    }
  }

  async deleteBooking(bookingId: string): Promise<void> {
    await this.firestore.delete(this.collectionPath, bookingId);
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = this.bookingsState().find(
      (item) => item.id === bookingId && item.userId === userId,
    );

    if (booking) {
      await this.firestore.update(this.collectionPath, { ...booking, status: 'otkazano' });
    }
  }

  private withTrainerNote(message: string, trainerName: string): string {
    const trainerNote = `Izabrani trener: ${trainerName}`;

    return message ? `${trainerNote} | ${message}` : trainerNote;
  }

  private isPermissionDenied(error: unknown): boolean {
    return (error as { code?: string })?.code === 'permission-denied';
  }
}
