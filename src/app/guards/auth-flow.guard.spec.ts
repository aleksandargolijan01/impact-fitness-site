import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminAuthGuard } from './admin-auth.guard';
import { userAuthGuard } from './user-auth.guard';

describe('auth route guards', () => {
  const authMock = {
    waitUntilReady: vi.fn().mockResolvedValue(undefined),
    isAdmin: vi.fn(),
    isUser: vi.fn(),
  };

  beforeEach(() => {
    authMock.waitUntilReady.mockResolvedValue(undefined);
    authMock.isAdmin.mockReturnValue(false);
    authMock.isUser.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    });
  });

  it('redirects anonymous visitors away from admin routes', async () => {
    expect(serialize(await runAdminGuard())).toBe('/login');
  });

  it('redirects anonymous visitors away from user routes', async () => {
    expect(serialize(await runUserGuard())).toBe('/login');
  });

  it('allows admins into admin routes and blocks them from user routes', async () => {
    authMock.isAdmin.mockReturnValue(true);

    expect(await runAdminGuard()).toBe(true);
    expect(serialize(await runUserGuard())).toBe('/admin/dashboard');
  });

  it('allows users into user routes and blocks them from admin routes', async () => {
    authMock.isUser.mockReturnValue(true);

    expect(await runUserGuard()).toBe(true);
    expect(serialize(await runAdminGuard())).toBe('/user/dashboard');
  });

  function runAdminGuard(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () => adminAuthGuard({} as never, {} as never) as Promise<boolean | UrlTree>,
    );
  }

  function runUserGuard(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () => userAuthGuard({} as never, {} as never) as Promise<boolean | UrlTree>,
    );
  }

  function serialize(result: boolean | UrlTree): string {
    if (typeof result === 'boolean') {
      return result.toString();
    }

    return TestBed.inject(Router).serializeUrl(result);
  }
});
