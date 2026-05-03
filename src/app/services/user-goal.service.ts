import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { where } from '@angular/fire/firestore';
import { UserGoal } from '../models/user-goal.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionService } from './firestore-collection.service';

@Injectable({
  providedIn: 'root',
})
export class UserGoalService {
  private readonly collectionPath = 'userGoals';
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly goalsState = signal<UserGoal[]>([]);
  private readonly loadingState = signal(false);

  readonly goals = computed(() => this.goalsState());
  readonly isLoading = computed(() => this.loadingState());

  constructor() {
    effect((onCleanup) => {
      const user = this.authService.currentUser();

      this.goalsState.set([]);

      if (!user) {
        this.loadingState.set(false);
        return;
      }

      this.loadingState.set(true);
      const goals$ =
        user.role === 'admin'
          ? this.firestore.listen<UserGoal>(this.collectionPath)
          : this.firestore.listenWhere<UserGoal>(
              this.collectionPath,
              where('userId', '==', user.id),
            );

      const subscription = goals$.subscribe({
        next: (goals) => {
          this.goalsState.set(goals);
          this.loadingState.set(false);
        },
        error: (error) => {
          console.error('Failed to load user goals from Firestore', error);
          this.goalsState.set([]);
          this.loadingState.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  getCurrentMonthGoal(userId: string): UserGoal | undefined {
    const now = new Date();

    return this.goalsState().find(
      (goal) =>
        goal.userId === userId &&
        goal.month === now.getMonth() + 1 &&
        goal.year === now.getFullYear(),
    );
  }

  async saveMonthlyGoal(userId: string, monthlyGoal: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const goal: UserGoal = {
      id: `${userId}-${year}-${String(month).padStart(2, '0')}`,
      userId,
      monthlyGoal,
      month,
      year,
    };

    await this.firestore.set(this.collectionPath, goal);
  }
}
