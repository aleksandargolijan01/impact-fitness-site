import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  await authService.waitUntilReady();

  if (authService.isAdmin()) {
    return true;
  }

  if (authService.isUser()) {
    return router.createUrlTree(['/user/dashboard']);
  }

  return router.createUrlTree(['/login']);
};
