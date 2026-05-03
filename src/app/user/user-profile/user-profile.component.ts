import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Profil</p>
        <h1>Uredi podatke</h1>
      </div>

      @if (successMessage) {
        <div class="success" role="status">{{ successMessage }}</div>
      }

      @if (errorMessage) {
        <div class="error" role="alert">{{ errorMessage }}</div>
      }

      <form class="card panel-form" [formGroup]="form" (ngSubmit)="save()">
        <label>Ime i prezime <input formControlName="fullName" /></label>
        <label>Email <input type="email" formControlName="email" /></label>
        <label>Telefon <input formControlName="phone" /></label>
        <label>Novi password <input type="password" formControlName="password" /></label>
        <button class="btn btn--primary full" type="submit" [disabled]="isSaving">
          {{ isSaving ? 'Cuvanje...' : 'Sacuvaj profil' }}
        </button>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  successMessage = '';
  errorMessage = '';
  isSaving = false;

  readonly form = this.fb.nonNullable.group({
    fullName: [this.authService.currentUser()?.fullName ?? '', Validators.required],
    email: [this.authService.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.authService.currentUser()?.phone ?? '', Validators.required],
    password: ['', Validators.minLength(6)],
  });

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const updates = {
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      ...(raw.password ? { password: raw.password } : {}),
    };

    this.isSaving = true;

    try {
      await this.authService.updateProfile(updates);
      this.form.patchValue({ password: '' });
      this.successMessage = 'Profil je sacuvan.';
      this.errorMessage = '';
    } catch (error) {
      console.error('Updating user profile failed', error);
      this.successMessage = '';
      this.errorMessage = 'Profil trenutno nije sacuvan. Pokusaj ponovo.';
    } finally {
      this.isSaving = false;
    }
  }
}
