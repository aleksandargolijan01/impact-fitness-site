import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <form class="auth-card card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="section-kicker">Login</p>
        <h1>Prijavi se</h1>
        <p class="auth-note">Jedna prijava za admin panel i korisnicki dashboard.</p>

        @if (errorMessage) {
          <div class="error" role="alert">{{ errorMessage }}</div>
        }

        <label>Email <input type="email" formControlName="email" /></label>
        <label>Password <input type="password" formControlName="password" /></label>
        <button class="btn btn--primary" type="submit" [disabled]="isLoading">
          {{ isLoading ? 'Prijava...' : 'Prijavi se' }}
        </button>
        <a class="btn btn--ghost" routerLink="/">Nazad na sajt</a>
        <a routerLink="/register">Nemas nalog? Registruj se</a>
      </form>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  errorMessage = '';
  isLoading = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';

    const user = await this.authService.login(email, password);
    this.isLoading = false;

    if (!user) {
      this.errorMessage = 'Pogresan email ili password.';
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const targetUrl = user.role === 'admin' ? '/admin/dashboard' : returnUrl || '/user/dashboard';

    this.router.navigateByUrl(targetUrl);
  }
}
