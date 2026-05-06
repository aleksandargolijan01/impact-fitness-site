import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MembershipApplicationService } from '../services/membership-application.service';
import { PricingService } from '../services/pricing.service';
import { ScrollService } from '../services/scroll.service';

@Component({
  selector: 'app-membership-checkout',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <form class="auth-card card" [formGroup]="form" (ngSubmit)="submit()">
        <p class="section-kicker">Clanarina</p>
        <h1>Prijava za paket</h1>

        @if (selectedPackage()) {
          <div class="success" role="status">
            {{ selectedPackage()?.name }} / {{ selectedPackage()?.price }}
          </div>
        } @else {
          <div class="error" role="alert">Izabrani paket nije pronadjen.</div>
        }

        @if (successMessage) {
          <div class="success" role="status">{{ successMessage }}</div>
        }

        @if (errorMessage) {
          <div class="error" role="alert">{{ errorMessage }}</div>
        }

        <label>Ime i prezime <input formControlName="fullName" /></label>
        <label>Email <input type="email" formControlName="email" /></label>
        <label>Telefon <input formControlName="phone" /></label>
        <label>Datum pocetka <input type="date" formControlName="startDate" /></label>
        <label>Broj licnog dokumenta <input formControlName="documentNumber" /></label>
        <label>Napomena <textarea rows="4" formControlName="note"></textarea></label>
        <label class="check-row">
          <input type="checkbox" formControlName="confirmation" />
          <span>Clanarinu zavrsavam i karticu preuzimam u teretani</span>
        </label>

        <button class="btn btn--primary" type="submit" [disabled]="isSaving || !selectedPackage()">
          {{ isSaving ? 'Slanje...' : 'Posalji prijavu' }}
        </button>
        <a class="btn btn--ghost" href="/#pricing" (click)="scrollService.goToSection('pricing', $event)">Nazad na cenovnik</a>
      </form>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembershipCheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly pricingService = inject(PricingService);
  private readonly membershipService = inject(MembershipApplicationService);
  readonly scrollService = inject(ScrollService);

  readonly packageId = this.route.snapshot.paramMap.get('packageId') ?? '';
  readonly selectedPackage = computed(() =>
    this.pricingService.plans().find((plan) => plan.id === this.packageId),
  );

  successMessage = '';
  errorMessage = '';
  isSaving = false;

  readonly form = this.fb.nonNullable.group({
    fullName: [this.authService.currentUser()?.fullName ?? '', Validators.required],
    email: [this.authService.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.authService.currentUser()?.phone ?? '', Validators.required],
    startDate: ['', Validators.required],
    documentNumber: [''],
    note: [''],
    confirmation: [false, Validators.requiredTrue],
  });

  async submit(): Promise<void> {
    const user = this.authService.currentUser();
    const selectedPackage = this.selectedPackage();

    if (!user) {
      await this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/membership/checkout/${this.packageId}` },
      });
      return;
    }

    if (!selectedPackage || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      await this.membershipService.createApplication({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: raw.phone.trim(),
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        startDate: raw.startDate,
        documentNumber: raw.documentNumber.trim(),
        note: raw.note.trim(),
      });

      this.successMessage = 'Prijava je poslata. Tim ce te kontaktirati za zavrsetak clanarine.';
      this.form.patchValue({ documentNumber: '', note: '', confirmation: false });
    } catch (error) {
      console.error('Creating membership application failed', error);
      this.errorMessage = 'Prijava trenutno nije sacuvana. Proveri vezu i pokusaj ponovo.';
    } finally {
      this.isSaving = false;
    }
  }
}
