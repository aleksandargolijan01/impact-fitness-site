import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserLoginComponent } from './user-login.component';

describe('UserLoginComponent', () => {
  const authMock = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    authMock.login.mockReset();

    await TestBed.configureTestingModule({
      imports: [UserLoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();
  });

  it('redirects admin login to the admin dashboard', async () => {
    authMock.login.mockResolvedValue({
      id: 'admin',
      fullName: 'Impact Fitness Admin',
      email: 'admin@impactfitness.com',
      phone: '',
      role: 'admin',
    });

    const fixture = TestBed.createComponent(UserLoginComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.form.setValue({
      email: 'admin@impactfitness.com',
      password: 'TestPassword123!',
    });
    await fixture.componentInstance.submit();

    expect(navigateSpy).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('redirects user login to the user dashboard', async () => {
    authMock.login.mockResolvedValue({
      id: 'user-1',
      fullName: 'Petar Petrovic',
      email: 'petar@example.com',
      phone: '061222333',
      role: 'user',
    });

    const fixture = TestBed.createComponent(UserLoginComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.form.setValue({
      email: 'petar@example.com',
      password: 'TestPassword123!',
    });
    await fixture.componentInstance.submit();

    expect(navigateSpy).toHaveBeenCalledWith('/user/dashboard');
  });

  it('shows an error for wrong credentials', async () => {
    authMock.login.mockResolvedValue(null);
    const fixture = TestBed.createComponent(UserLoginComponent);

    fixture.componentInstance.form.setValue({
      email: 'nobody@example.com',
      password: 'wrong-password',
    });
    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pogresan email ili password.');
  });
});
