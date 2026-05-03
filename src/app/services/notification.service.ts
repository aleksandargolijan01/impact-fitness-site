import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { where } from '@angular/fire/firestore';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { FirestoreCollectionService } from './firestore-collection.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly collectionPath = 'notifications';
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly notificationsState = signal<Notification[]>([]);
  private readonly loadingState = signal(false);

  readonly notifications = computed(() => this.notificationsState());
  readonly isLoading = computed(() => this.loadingState());

  constructor() {
    effect((onCleanup) => {
      const user = this.authService.currentUser();

      this.notificationsState.set([]);

      if (!user) {
        this.loadingState.set(false);
        return;
      }

      this.loadingState.set(true);
      const notifications$ =
        user.role === 'admin'
          ? this.firestore.listen<Notification>(this.collectionPath)
          : this.firestore.listenWhere<Notification>(
              this.collectionPath,
              where('userId', '==', user.id),
            );

      const subscription = notifications$.subscribe({
        next: (notifications) => {
          this.notificationsState.set(
            [...notifications].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
          );
          this.loadingState.set(false);
        },
        error: (error) => {
          console.error('Failed to load notifications from Firestore', error);
          this.notificationsState.set([]);
          this.loadingState.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }
}
