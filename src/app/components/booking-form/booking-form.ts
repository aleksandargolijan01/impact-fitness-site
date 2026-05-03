import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BookingEmailPayload, BookingEmailService } from '../../services/booking-email.service';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { TrainerService } from '../../services/trainer.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFormComponent {
  private static readonly submitCooldownMs = 15000;
  private static readonly noPreferenceTrainerId = 'no-preference';
  private static readonly fallbackTrainerId = 'assign-trainer';
  private static readonly groupTrainingServiceType = 'Grupni trening';

  formSubmitted = false;
  successMessageVisible = false;
  errorMessage = '';
  isSending = false;
  private lastSubmittedAt = 0;
  private prefilledUserId = '';
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly bookingEmailService = inject(BookingEmailService);
  private readonly bookingService = inject(BookingService);
  readonly trainerService = inject(TrainerService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly bookingForm = this.fb.nonNullable.group({
    fullName: [
      '',
      [
        BookingFormComponent.trimRequiredValidator,
        Validators.minLength(2),
        Validators.maxLength(80),
      ],
    ],
    phone: ['', [BookingFormComponent.trimRequiredValidator, BookingFormComponent.phoneValidator]],
    email: [
      '',
      [BookingFormComponent.trimRequiredValidator, Validators.email, Validators.maxLength(120)],
    ],
    goal: ['', BookingFormComponent.trimRequiredValidator],
    trainerId: ['', BookingFormComponent.trimRequiredValidator],
    message: ['', Validators.maxLength(800)],
    website: [''],
  });

  constructor() {
    effect(() => {
      this.prefillFromCurrentUser();
    });
  }

  async submit(): Promise<void> {
    if (this.isSending) {
      return;
    }

    this.formSubmitted = true;
    this.successMessageVisible = false;
    this.errorMessage = '';
    this.normalizeFormValues();

    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    if (this.bookingForm.controls.website.value) {
      this.finishBlockedSubmit();
      return;
    }

    if (this.isSubmitTooSoon()) {
      this.errorMessage = 'Zahtev je vec poslat. Sacekaj nekoliko sekundi pre ponovnog slanja.';
      return;
    }

    this.isSending = true;
    this.bookingForm.disable();

    try {
      await this.bookingService.createBooking({
        ...this.createPayload(),
        source: this.authService.currentUser() ? 'user' : 'public',
      });
      try {
        await this.bookingEmailService.sendBookingRequest(this.createPayload());
      } catch {
        // Firestore is the source of truth; EmailJS is only a notification layer.
      }
      this.lastSubmittedAt = Date.now();
      this.successMessageVisible = true;
      this.formSubmitted = false;
      this.bookingForm.reset();
      this.prefilledUserId = '';
      this.prefillFromCurrentUser();
    } catch (error) {
      console.error('Creating public booking failed', error);
      this.errorMessage = 'Slanje trenutno nije uspelo. Proveri internet vezu i pokusaj ponovo.';
    } finally {
      this.isSending = false;
      this.bookingForm.enable();
      this.cdr.markForCheck();
    }
  }

  hasError(controlName: keyof typeof this.bookingForm.controls): boolean {
    const control = this.bookingForm.controls[controlName];
    return control.invalid && (control.touched || this.formSubmitted);
  }

  private normalizeFormValues(): void {
    const rawValue = this.bookingForm.getRawValue();

    this.bookingForm.patchValue(
      {
        fullName: this.cleanInput(rawValue.fullName),
        phone: this.cleanInput(rawValue.phone),
        email: this.cleanInput(rawValue.email).toLowerCase(),
        goal: this.cleanInput(rawValue.goal),
        trainerId: this.cleanInput(rawValue.trainerId),
        message: this.cleanInput(rawValue.message),
        website: rawValue.website,
      },
      { emitEvent: false },
    );
  }

  private createPayload(): BookingEmailPayload & { userId?: string } {
    const rawValue = this.bookingForm.getRawValue();
    const user = this.authService.currentUser();

    const payload: BookingEmailPayload & { userId?: string } = {
      fullName: rawValue.fullName,
      phone: rawValue.phone,
      email: rawValue.email,
      goal: rawValue.goal,
      serviceType: BookingFormComponent.groupTrainingServiceType,
      trainerId: rawValue.trainerId,
      trainerName: this.getTrainerName(rawValue.trainerId),
      message: rawValue.message,
    };

    if (user) {
      payload.userId = user.id;
    }

    return payload;
  }

  private getTrainerName(trainerId: string): string {
    if (trainerId === BookingFormComponent.noPreferenceTrainerId) {
      return 'Nije bitno - predlozite mi trenera';
    }

    if (trainerId === BookingFormComponent.fallbackTrainerId) {
      return 'Dodeli trenera po izboru';
    }

    return (
      this.trainerService.trainers().find((trainer) => trainer.id === trainerId)?.name ??
      'Dodeli trenera po izboru'
    );
  }

  private prefillFromCurrentUser(): void {
    const user = this.authService.currentUser();

    if (!user || user.id === this.prefilledUserId) {
      return;
    }

    this.prefilledUserId = user.id;
    this.bookingForm.patchValue(
      {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || this.bookingForm.controls.phone.value,
      },
      { emitEvent: false },
    );
  }

  private finishBlockedSubmit(): void {
    this.successMessageVisible = true;
    this.formSubmitted = false;
    this.bookingForm.reset();
  }

  private isSubmitTooSoon(): boolean {
    return Date.now() - this.lastSubmittedAt < BookingFormComponent.submitCooldownMs;
  }

  private cleanInput(value: string): string {
    return value
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static trimRequiredValidator(control: AbstractControl): ValidationErrors | null {
    return String(control.value ?? '').trim().length > 0 ? null : { required: true };
  }

  private static phoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '').trim();
    const hasAllowedCharactersOnly = /^[+()\d\s-]{6,20}$/.test(value);
    const digitCount = value.replace(/\D/g, '').length;

    return hasAllowedCharactersOnly && digitCount >= 6 ? null : { phone: true };
  }
}
