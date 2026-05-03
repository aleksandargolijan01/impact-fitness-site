import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <form class="auth-card card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="section-kicker">Registracija</p>
        <h1>Napravi nalog</h1>
        <p class="auth-note">Nalog se cuva u Firebase Auth i Firestore bazi.</p>

        @if (errorMessage) {
          <div class="error" role="alert">{{ errorMessage }}</div>
        }

        <label>Ime i prezime <input formControlName="fullName" /></label>
        <label>Email <input type="email" formControlName="email" /></label>
        <label>Telefon <input formControlName="phone" /></label>
        <label>Password <input type="password" formControlName="password" /></label>
        <label>Confirm password <input type="password" formControlName="confirmPassword" /></label>
        @if (form.hasError('passwordMismatch') && form.touched) {
          <span class="field-error">Password i confirm password moraju biti isti.</span>
        }
        <button class="btn btn--primary" type="submit" [disabled]="isLoading">
          {{ isLoading ? 'Kreiranje...' : 'Registruj se' }}
        </button>
        <a routerLink="/login">Vec imas nalog? Prijavi se</a>
      </form>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  errorMessage = '';
  isLoading = false;

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: UserRegisterComponent.passwordMatchValidator },
  );

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';

    const result = await this.authService.register({
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      password: raw.password,
    });
    this.isLoading = false;

    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    this.router.navigateByUrl('/user/dashboard');
  }

  private static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
