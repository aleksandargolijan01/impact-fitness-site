import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { serverTimestamp, where } from '@angular/fire/firestore';
import { CheckIn, CreateCheckInPayload } from '../models/check-in.model';
import { CurrentUser } from '../models/user.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionService } from './firestore-collection.service';

export const VALID_CHECK_IN_QR_CODE = 'IMPACT_GYM_CHECKIN';

@Injectable({
  providedIn: 'root',
})
export class CheckInService {
  private readonly collectionPath = 'checkIns';
  private readonly checkInCooldownMs = 2 * 60 * 60 * 1000;
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly checkInsState = signal<CheckIn[]>([]);
  private readonly loadingState = signal(false);

  readonly checkIns = computed(() => this.checkInsState());
  readonly isLoading = computed(() => this.loadingState());

  constructor() {
    effect((onCleanup) => {
      const user = this.authService.currentUser();

      this.checkInsState.set([]);

      if (!user) {
        this.loadingState.set(false);
        return;
      }

      this.loadingState.set(true);
      const checkIns$ =
        user.role === 'admin'
          ? this.firestore.listen<CheckIn>(this.collectionPath)
          : this.firestore.listenWhere<CheckIn>(
              this.collectionPath,
              where('userId', '==', user.id),
            );

      const subscription = checkIns$.subscribe({
        next: (checkIns) => {
          this.checkInsState.set(this.sortCheckIns(checkIns));
          this.loadingState.set(false);
        },
        error: (error) => {
          console.error('Failed to load check-ins from Firestore', error);
          this.checkInsState.set([]);
          this.loadingState.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  async createCheckIn(checkIn: CreateCheckInPayload): Promise<void> {
    if (checkIn.qrCodeValue !== VALID_CHECK_IN_QR_CODE) {
      throw new Error('INVALID_QR_CODE');
    }

    if (!this.canCreateCheckIn(checkIn.userId)) {
      throw new Error('CHECK_IN_TOO_SOON');
    }

    const now = new Date();
    const item: CheckIn = {
      ...checkIn,
      id: this.firestore.createId(this.collectionPath),
      date: this.toDateKey(now),
      time: this.toTimeKey(now),
      createdAt: now.toISOString(),
    };

    await this.firestore.set(this.collectionPath, {
      ...item,
      createdAt: serverTimestamp() as unknown as string,
    });
  }

  async createManualCheckIn(user: CurrentUser): Promise<void> {
    const now = new Date();
    const item: CheckIn = {
      id: this.firestore.createId(this.collectionPath),
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      date: this.toDateKey(now),
      time: this.toTimeKey(now),
      createdAt: now.toISOString(),
      qrCodeValue: 'ADMIN_MANUAL_CHECKIN',
    };

    await this.firestore.set(this.collectionPath, {
      ...item,
      createdAt: serverTimestamp() as unknown as string,
    });
  }

  getCheckInsByUserId(userId: string): CheckIn[] {
    return this.checkInsState().filter((checkIn) => checkIn.userId === userId);
  }

  getAllCheckIns(): CheckIn[] {
    return this.checkInsState();
  }

  getTodayCheckInsByUserId(userId: string): CheckIn[] {
    const today = this.toDateKey(new Date());

    return this.getCheckInsByUserId(userId).filter((checkIn) => checkIn.date === today);
  }

  getMonthlyCheckInsByUserId(userId: string): CheckIn[] {
    const monthKey = this.toMonthKey(new Date());

    return this.getCheckInsByUserId(userId).filter((checkIn) => checkIn.date.startsWith(monthKey));
  }

  canCreateCheckIn(userId: string): boolean {
    const latestCheckIn = this.getCheckInsByUserId(userId)[0];

    if (!latestCheckIn) {
      return true;
    }

    const latestTime = this.toCheckInDate(latestCheckIn).getTime();

    return Date.now() - latestTime >= this.checkInCooldownMs;
  }

  formatCheckIn(checkIn?: CheckIn): string {
    if (!checkIn) {
      return '-';
    }

    return `${this.formatDate(checkIn.date)} u ${checkIn.time}`;
  }

  private sortCheckIns(checkIns: CheckIn[]): CheckIn[] {
    return [...checkIns].sort((a, b) => this.toSortKey(b).localeCompare(this.toSortKey(a)));
  }

  private toSortKey(checkIn: CheckIn): string {
    if (typeof checkIn.createdAt === 'string') {
      return checkIn.createdAt;
    }

    return `${checkIn.date}T${checkIn.time}`;
  }

  private toCheckInDate(checkIn: CheckIn): Date {
    const date = new Date(`${checkIn.date}T${checkIn.time || '00:00'}`);

    return Number.isNaN(date.getTime()) ? new Date(checkIn.createdAt) : date;
  }

  private toDateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private toTimeKey(date: Date): string {
    return [date.getHours(), date.getMinutes()]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return day && month && year ? `${day}.${month}.${year}.` : value;
  }
}
