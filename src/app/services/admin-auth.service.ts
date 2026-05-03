import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private readonly authService = inject(AuthService);

  readonly isLoggedIn = computed(() => this.authService.isAdmin());

  async login(email: string, password: string): Promise<boolean> {
    return (await this.authService.login(email, password))?.role === 'admin';
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
