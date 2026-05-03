import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingEmailService } from '../../services/booking-email.service';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { TrainerService } from '../../services/trainer.service';
import { BookingFormComponent } from './booking-form';

describe('BookingFormComponent', () => {
  let fixture: ComponentFixture<BookingFormComponent>;
  let component: BookingFormComponent;
  let emailService: {
    sendBookingRequest: ReturnType<typeof vi.fn>;
  };
  let bookingService: {
    createBooking: ReturnType<typeof vi.fn>;
  };
  let authService: {
    currentUser: ReturnType<typeof vi.fn>;
  };
  let trainerService: {
    trainers: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    emailService = {
      sendBookingRequest: vi.fn(),
    };
    bookingService = {
      createBooking: vi.fn().mockResolvedValue(undefined),
    };
    authService = {
      currentUser: vi.fn().mockReturnValue(null),
    };
    trainerService = {
      trainers: vi.fn().mockReturnValue([{ id: 'trainer-1', name: 'Marko Markovic' }]),
    };

    await TestBed.configureTestingModule({
      imports: [BookingFormComponent],
      providers: [
        { provide: BookingEmailService, useValue: emailService },
        { provide: AuthService, useValue: authService },
        { provide: BookingService, useValue: bookingService },
        { provide: TrainerService, useValue: trainerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingFormComponent);
    component = fixture.componentInstance;
  });

  it('should show validation state when required fields are missing', async () => {
    await component.submit();

    expect(component.bookingForm.invalid).toBe(true);
    expect(component.hasError('fullName')).toBe(true);
    expect(component.hasError('phone')).toBe(true);
    expect(component.hasError('email')).toBe(true);
    expect(component.successMessageVisible).toBe(false);
    expect(emailService.sendBookingRequest).not.toHaveBeenCalled();
  });

  it('should show success message after a valid submission', async () => {
    emailService.sendBookingRequest.mockResolvedValue(undefined);
    component.bookingForm.setValue({
      fullName: 'Petar Petrovic',
      phone: '+381 64 123 4567',
      email: 'petar@example.com',
      goal: 'Kondicija',
      trainerId: 'trainer-1',
      message: 'Probni trening ove nedelje.',
      website: '',
    });

    await component.submit();

    expect(component.successMessageVisible).toBe(true);
    expect(component.formSubmitted).toBe(false);
    expect(component.isSending).toBe(false);
    expect(emailService.sendBookingRequest).toHaveBeenCalledWith({
      fullName: 'Petar Petrovic',
      phone: '+381 64 123 4567',
      email: 'petar@example.com',
      goal: 'Kondicija',
      serviceType: 'Grupni trening',
      trainerId: 'trainer-1',
      trainerName: 'Marko Markovic',
      message: 'Probni trening ove nedelje.',
    });
  });

  it('should prefill contact fields and save userId when a user is logged in', async () => {
    authService.currentUser.mockReturnValue({
      id: 'user-1',
      fullName: 'Petar Petrovic',
      email: 'petar@example.com',
      phone: '+381 64 123 4567',
      role: 'user',
    });
    fixture = TestBed.createComponent(BookingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.bookingForm.patchValue({
      goal: 'Kondicija',
      trainerId: 'trainer-1',
      message: '',
    });

    await component.submit();

    expect(bookingService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        fullName: 'Petar Petrovic',
        email: 'petar@example.com',
        phone: '+381 64 123 4567',
        trainerId: 'trainer-1',
        trainerName: 'Marko Markovic',
        source: 'user',
      }),
    );
  });

  it('should keep the booking successful when email notification fails', async () => {
    emailService.sendBookingRequest.mockRejectedValue(new Error('Failed'));
    component.bookingForm.setValue({
      fullName: 'Petar Petrovic',
      phone: '+381 64 123 4567',
      email: 'petar@example.com',
      goal: 'Kondicija',
      trainerId: 'trainer-1',
      message: 'Probni trening ove nedelje.',
      website: '',
    });

    await component.submit();

    expect(component.successMessageVisible).toBe(true);
    expect(component.errorMessage).toBe('');
    expect(component.isSending).toBe(false);
  });

  it('should block whitespace-only values before sending', async () => {
    component.bookingForm.setValue({
      fullName: '   ',
      phone: '------',
      email: 'petar@example.com',
      goal: 'Kondicija',
      trainerId: 'trainer-1',
      message: '',
      website: '',
    });

    await component.submit();

    expect(component.bookingForm.invalid).toBe(true);
    expect(emailService.sendBookingRequest).not.toHaveBeenCalled();
  });

  it('should sanitize values before sending', async () => {
    emailService.sendBookingRequest.mockResolvedValue(undefined);
    component.bookingForm.setValue({
      fullName: '  Petar <script> Petrovic  ',
      phone: '  +381 64 123 4567  ',
      email: '  PETAR@EXAMPLE.COM  ',
      goal: ' Kondicija ',
      trainerId: ' trainer-1 ',
      message: '  <b>Probni</b>   trening  ',
      website: '',
    });

    await component.submit();

    expect(emailService.sendBookingRequest).toHaveBeenCalledWith({
      fullName: 'Petar script Petrovic',
      phone: '+381 64 123 4567',
      email: 'petar@example.com',
      goal: 'Kondicija',
      serviceType: 'Grupni trening',
      trainerId: 'trainer-1',
      trainerName: 'Marko Markovic',
      message: 'bProbni/b trening',
    });
  });

  it('should ignore honeypot spam submissions', async () => {
    component.bookingForm.setValue({
      fullName: 'Petar Petrovic',
      phone: '+381 64 123 4567',
      email: 'petar@example.com',
      goal: 'Kondicija',
      trainerId: 'trainer-1',
      message: '',
      website: 'spam-site',
    });

    await component.submit();

    expect(component.successMessageVisible).toBe(true);
    expect(emailService.sendBookingRequest).not.toHaveBeenCalled();
  });
});
