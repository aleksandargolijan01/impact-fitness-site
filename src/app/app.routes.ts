import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';
import { userAuthGuard } from './guards/user-auth.guard';
import { HomePage } from './pages/home-page/home-page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./user/user-login/user-login.component').then((m) => m.UserLoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./user/user-register/user-register.component').then((m) => m.UserRegisterComponent),
  },
  {
    path: 'admin/login',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'membership/checkout/:packageId',
    loadComponent: () =>
      import('./membership/membership-checkout.component').then(
        (m) => m.MembershipCheckoutComponent,
      ),
    canActivate: [userAuthGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin-shell/admin-shell.component').then((m) => m.AdminShellComponent),
    canActivate: [adminAuthGuard],
    canActivateChild: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./admin/admin-pricing/admin-pricing.component').then(
            (m) => m.AdminPricingComponent,
          ),
      },
      {
        path: 'trainers',
        loadComponent: () =>
          import('./admin/admin-trainers/admin-trainers.component').then(
            (m) => m.AdminTrainersComponent,
          ),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./admin/admin-services/admin-services.component').then(
            (m) => m.AdminServicesComponent,
          ),
      },
      {
        path: 'gallery',
        loadComponent: () =>
          import('./admin/admin-gallery/admin-gallery.component').then(
            (m) => m.AdminGalleryComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./admin/admin-bookings/admin-bookings.component').then(
            (m) => m.AdminBookingsComponent,
          ),
      },
      {
        path: 'memberships',
        loadComponent: () =>
          import('./admin/admin-memberships/admin-memberships.component').then(
            (m) => m.AdminMembershipsComponent,
          ),
      },
      {
        path: 'check-ins',
        loadComponent: () =>
          import('./admin/admin-check-ins/admin-check-ins.component').then(
            (m) => m.AdminCheckInsComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./admin/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
    ],
  },
  {
    path: 'user/login',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'user/register',
    redirectTo: '/register',
    pathMatch: 'full',
  },
  {
    path: 'user',
    loadComponent: () =>
      import('./user/user-shell/user-shell.component').then((m) => m.UserShellComponent),
    canActivate: [userAuthGuard],
    canActivateChild: [userAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./user/user-dashboard/user-dashboard.component').then(
            (m) => m.UserDashboardComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./user/user-bookings/user-bookings.component').then((m) => m.UserBookingsComponent),
      },
      {
        path: 'memberships',
        loadComponent: () =>
          import('./user/user-memberships/user-memberships.component').then(
            (m) => m.UserMembershipsComponent,
          ),
      },
      {
        path: 'check-in',
        loadComponent: () =>
          import('./user/user-check-in/user-check-in.component').then(
            (m) => m.UserCheckInComponent,
          ),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./user/user-progress/user-progress.component').then(
            (m) => m.UserProgressComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./user/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
