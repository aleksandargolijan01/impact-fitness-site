import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import {
  Auth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { CurrentUser, User } from '../models/user.model';
import { toUserFriendlyFirebaseError } from './firebase-error.util';

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: CurrentUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly cachedUserKey = 'impactFitness.currentUser';
  private readonly adminEmail = 'admin@impactfitness.com';
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly usersState = signal<CurrentUser[]>([]);
  private readonly currentUserState = signal<CurrentUser | null>(null);
  private readonly authLoadingState = signal(true);
  private authReadyResolve!: () => void;
  private authReadyResolved = false;
  private usersSubscription?: Subscription;
  private readonly authReadyPromise = new Promise<void>((resolve) => {
    this.authReadyResolve = resolve;
  });

  readonly users = computed(() => this.usersState());
  readonly currentUser = computed(() => this.currentUserState());
  readonly authLoading = computed(() => this.authLoadingState());
  readonly authReady = computed(() => !this.authLoadingState());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      this.resolveAuthReady();
      return;
    }

    void this.initializeAuthState();
  }

  private async initializeAuthState(): Promise<void> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
    } catch (error) {
      console.error('Failed to configure Firebase auth persistence', error);
    }

    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (!firebaseUser) {
        this.currentUserState.set(null);
        this.updateUsersListener(null);
        this.resolveAuthReady();
        return;
      }

      try {
        const profile = await this.ensureUserProfile(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName ?? '',
        );

        const currentUser = this.toCurrentUser(profile);

        if (currentUser.active === false) {
          this.currentUserState.set(null);
          this.clearCachedCurrentUser();
          this.updateUsersListener(null);
          this.resolveAuthReady();
          return;
        }

        this.currentUserState.set(currentUser);
        this.cacheCurrentUser(currentUser);
        this.updateUsersListener(currentUser);
      } catch (error) {
        console.error('Failed to load user profile from Firestore', error);
        const cachedUser = this.getCachedCurrentUser(firebaseUser.uid);

        this.currentUserState.set(cachedUser);
        this.updateUsersListener(cachedUser);
      } finally {
        this.resolveAuthReady();
      }
    });
  }

  async register(payload: RegisterPayload): Promise<AuthResult> {
    try {
      const email = payload.email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(this.auth, email, payload.password);
      const user: User = {
        id: credential.user.uid,
        fullName: payload.fullName.trim(),
        email,
        phone: payload.phone.trim(),
        role: 'user',
        active: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(this.firestore, 'users', user.id), user);
      const currentUser = this.toCurrentUser(user);
      this.currentUserState.set(currentUser);
      this.cacheCurrentUser(currentUser);
      this.updateUsersListener(currentUser);

      return { success: true, message: 'Nalog je uspesno kreiran.', user: currentUser };
    } catch (error) {
      console.error('Firebase registration failed', error);
      return { success: false, message: toUserFriendlyFirebaseError(error) };
    }
  }

  async login(email: string, password: string): Promise<CurrentUser | null> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await signInWithEmailAndPassword(this.auth, normalizedEmail, password);
      const profile = await this.ensureUserProfile(
        credential.user.uid,
        credential.user.email ?? normalizedEmail,
        credential.user.displayName ?? '',
      );

      const currentUser = this.toCurrentUser(profile);

      if (currentUser.active === false) {
        await signOut(this.auth);
        this.currentUserState.set(null);
        this.clearCachedCurrentUser();
        return null;
      }

      this.currentUserState.set(currentUser);
      this.cacheCurrentUser(currentUser);
      this.updateUsersListener(currentUser);

      return currentUser;
    } catch (error) {
      console.error('Firebase login failed', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserState.set(null);
    this.clearCachedCurrentUser();
    this.updateUsersListener(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserState();
  }

  async getCurrentUser(): Promise<CurrentUser | null> {
    await this.waitUntilReady();

    return this.currentUserState();
  }

  getCurrentRole(): CurrentUser['role'] | null {
    return this.currentUserState()?.role ?? null;
  }

  isAdmin(): boolean {
    return this.getCurrentRole() === 'admin';
  }

  isUser(): boolean {
    const user = this.currentUserState();

    return user?.role === 'user' && user.active !== false;
  }

  async waitUntilReady(): Promise<void> {
    await this.authReadyPromise;
  }

  async updateProfile(updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
    const currentUser = this.currentUser();
    const firebaseUser = this.auth.currentUser;

    if (!currentUser || currentUser.role !== 'user' || !firebaseUser) {
      throw new Error('User profile update requires an authenticated user account.');
    }

    const nextEmail = updates.email?.trim().toLowerCase();
    const profileUpdates: Partial<User> = {
      ...updates,
      email: nextEmail ?? currentUser.email,
    };

    delete profileUpdates.password;

    if (nextEmail && nextEmail !== currentUser.email) {
      await updateEmail(firebaseUser, nextEmail);
    }

    if (updates.password) {
      await updatePassword(firebaseUser, updates.password);
    }

    await updateDoc(doc(this.firestore, 'users', currentUser.id), profileUpdates);

    const updatedUser = {
      ...currentUser,
      fullName: profileUpdates.fullName ?? currentUser.fullName,
      email: profileUpdates.email ?? currentUser.email,
      phone: profileUpdates.phone ?? currentUser.phone,
    };

    this.currentUserState.set(updatedUser);
    this.cacheCurrentUser(updatedUser);
    this.updateUsersListener(this.currentUserState());
  }

  async updateUserActive(userId: string, active: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', userId), { active });

    this.usersState.set(
      this.usersState().map((user) => (user.id === userId ? { ...user, active } : user)),
    );
  }

  private async ensureUserProfile(id: string, email: string, displayName: string): Promise<User> {
    const userRef = doc(this.firestore, 'users', id);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const existingUser = snapshot.data() as User;
      const normalizedEmail = (existingUser.email || email).trim().toLowerCase();
      const normalizedRole = normalizedEmail === this.adminEmail ? 'admin' : existingUser.role;

      if (existingUser.email !== normalizedEmail || existingUser.role !== normalizedRole) {
        const normalizedUser: User = {
          ...existingUser,
          email: normalizedEmail,
          role: normalizedRole,
          active: existingUser.active ?? true,
        };

        await setDoc(userRef, normalizedUser, { merge: true });

        return normalizedUser;
      }

      return existingUser;
    }

    const user: User = {
      id,
      fullName: displayName || (email === this.adminEmail ? 'Impact Fitness Admin' : ''),
      email: email.trim().toLowerCase(),
      phone: '',
      role: email.trim().toLowerCase() === this.adminEmail ? 'admin' : 'user',
      active: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, user);

    return user;
  }

  private resolveAuthReady(): void {
    if (this.authReadyResolved) {
      return;
    }

    this.authReadyResolved = true;
    this.authLoadingState.set(false);
    this.authReadyResolve();
  }

  private updateUsersListener(currentUser: CurrentUser | null): void {
    this.usersSubscription?.unsubscribe();
    this.usersSubscription = undefined;

    if (!currentUser) {
      this.usersState.set([]);
      return;
    }

    if (currentUser.role !== 'admin') {
      this.usersState.set([currentUser]);
      return;
    }

    this.usersSubscription = collectionData(collection(this.firestore, 'users'), {
      idField: 'id',
    }).subscribe({
      next: (users) => {
        this.usersState.set((users as User[]).map((user) => this.toCurrentUser(user)));
      },
      error: () => {
        this.usersState.set([currentUser]);
      },
    });
  }

  private toCurrentUser(user: User): CurrentUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active ?? true,
    };
  }

  private cacheCurrentUser(user: CurrentUser): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.cachedUserKey, JSON.stringify(user));
  }

  private getCachedCurrentUser(userId: string): CurrentUser | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const cachedUser = JSON.parse(
        localStorage.getItem(this.cachedUserKey) ?? 'null',
      ) as CurrentUser | null;

      return cachedUser?.id === userId ? cachedUser : null;
    } catch {
      return null;
    }
  }

  private clearCachedCurrentUser(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.cachedUserKey);
  }
}
