import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <form class="auth-card card" [formGroup]="loginForm" (ngSubmit)="submit()">
        <p class="section-kicker">Admin login</p>
        <h1>Impact Fitness admin</h1>
        <p class="auth-note">Admin prijava koristi Firebase Auth.</p>

        @if (errorMessage) {
          <div class="error" role="alert">{{ errorMessage }}</div>
        }

        <label>
          Email
          <input type="email" formControlName="email" placeholder="admin@impactfitness.com" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" placeholder="Unesi admin password" />
        </label>
        <button class="btn btn--primary" type="submit">Prijavi se</button>
        <a routerLink="/">Nazad na sajt</a>
      </form>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly adminAuthService = inject(AdminAuthService);

  errorMessage = '';

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    if (!(await this.adminAuthService.login(email, password))) {
      this.errorMessage = 'Pogresan email ili password.';
      return;
    }

    this.router.navigateByUrl('/admin/dashboard');
  }
}
