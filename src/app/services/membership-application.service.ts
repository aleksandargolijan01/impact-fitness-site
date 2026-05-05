import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { where } from '@angular/fire/firestore';
import { Observable, catchError, combineLatest, map, of } from 'rxjs';
import {
  MembershipApplication,
  MembershipApplicationStatus,
  normalizeMembershipStatus,
} from '../models/membership-application.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionService } from './firestore-collection.service';

export type CreateMembershipApplicationPayload = Omit<
  MembershipApplication,
  'id' | 'status' | 'createdAt'
>;

export type UpdateMembershipApplicationPayload = Pick<
  MembershipApplication,
  | 'id'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'packageName'
  | 'packagePrice'
  | 'startDate'
  | 'documentNumber'
  | 'note'
> & {
  status: MembershipApplicationStatus;
};

@Injectable({
  providedIn: 'root',
})
export class MembershipApplicationService {
  private readonly collectionPath = 'membershipApplications';
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly applicationsState = signal<MembershipApplication[]>([]);
  private readonly loadingState = signal(false);

  readonly applications = computed(() => this.applicationsState());
  readonly isLoading = computed(() => this.loadingState());

  constructor() {
    effect((onCleanup) => {
      const user = this.authService.currentUser();

      this.applicationsState.set([]);

      if (!user) {
        this.loadingState.set(false);
        return;
      }

      this.loadingState.set(true);
      const applications$ =
        user.role === 'admin'
          ? this.firestore.listen<MembershipApplication>(this.collectionPath)
          : this.listenForUser(user.id, user.email);

      const subscription = applications$.subscribe({
        next: (applications) => {
          this.applicationsState.set(this.sortApplications(applications));
          this.loadingState.set(false);
        },
        error: (error) => {
          console.error('Failed to load membership applications from Firestore', error);
          this.applicationsState.set([]);
          this.loadingState.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  getAllApplications(): MembershipApplication[] {
    return this.applicationsState();
  }

  getApplicationsByUserId(userId: string, email?: string): MembershipApplication[] {
    const normalizedEmail = email?.trim().toLowerCase();

    return this.applicationsState().filter((application) => {
      const applicationEmail = application.email?.trim().toLowerCase();

      return (
        application.userId === userId || (!!normalizedEmail && applicationEmail === normalizedEmail)
      );
    });
  }

  async createApplication(application: CreateMembershipApplicationPayload): Promise<void> {
    const item: MembershipApplication = {
      ...application,
      userId: application.userId.trim(),
      fullName: application.fullName.trim(),
      email: application.email.trim().toLowerCase(),
      startDate: application.startDate || new Date().toISOString().slice(0, 10),
      id: this.firestore.createId(this.collectionPath),
      status: 'na_cekanju',
      createdAt: new Date().toISOString(),
    };

    await this.firestore.set(this.collectionPath, item);
  }

  async updateApplicationStatus(id: string, status: MembershipApplicationStatus): Promise<void> {
    const application = this.applicationsState().find((item) => item.id === id);

    if (!application) {
      throw new Error(`Membership application ${id} was not found.`);
    }

    await this.firestore.update(this.collectionPath, {
      ...application,
      status: normalizeMembershipStatus(status),
    });
  }

  async updateApplication(payload: UpdateMembershipApplicationPayload): Promise<void> {
    const application = this.applicationsState().find((item) => item.id === payload.id);

    if (!application) {
      throw new Error(`Membership application ${payload.id} was not found.`);
    }

    await this.firestore.update(this.collectionPath, {
      ...application,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      packageName: payload.packageName.trim(),
      packagePrice: payload.packagePrice.trim(),
      startDate: payload.startDate,
      documentNumber: payload.documentNumber.trim(),
      note: payload.note.trim(),
      status: normalizeMembershipStatus(payload.status),
    });
  }

  async deleteApplication(id: string): Promise<void> {
    await this.firestore.delete(this.collectionPath, id);
  }

  private listenForUser(userId: string, email: string): Observable<MembershipApplication[]> {
    const normalizedEmail = email.trim().toLowerCase();
    const byUserId$ = this.firestore
      .listenWhere<MembershipApplication>(this.collectionPath, where('userId', '==', userId))
      .pipe(
        catchError((error) => {
          console.error('Failed to load membership applications by userId', error);

          return of([]);
        }),
      );

    if (!normalizedEmail) {
      return byUserId$;
    }

    const byEmail$ = this.firestore
      .listenWhere<MembershipApplication>(
        this.collectionPath,
        where('email', '==', normalizedEmail),
      )
      .pipe(
        catchError((error) => {
          console.error('Failed to load membership applications by email', error);

          return of([]);
        }),
      );

    return combineLatest([byUserId$, byEmail$]).pipe(
      map(([byUserId, byEmail]) => this.mergeApplications(byUserId, byEmail)),
    );
  }

  private mergeApplications(
    first: MembershipApplication[],
    second: MembershipApplication[],
  ): MembershipApplication[] {
    return Array.from(
      new Map([...first, ...second].map((application) => [application.id, application])).values(),
    );
  }

  private sortApplications(applications: MembershipApplication[]): MembershipApplication[] {
    return [...applications].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
}
