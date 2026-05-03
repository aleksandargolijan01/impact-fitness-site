import { Routes } from '@angular/router';
import { AdminBookingsComponent } from './admin/admin-bookings/admin-bookings.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminGalleryComponent } from './admin/admin-gallery/admin-gallery.component';
import { AdminMembershipsComponent } from './admin/admin-memberships/admin-memberships.component';
import { AdminPricingComponent } from './admin/admin-pricing/admin-pricing.component';
import { AdminServicesComponent } from './admin/admin-services/admin-services.component';
import { AdminShellComponent } from './admin/admin-shell/admin-shell.component';
import { AdminTrainersComponent } from './admin/admin-trainers/admin-trainers.component';
import { adminAuthGuard } from './guards/admin-auth.guard';
import { userAuthGuard } from './guards/user-auth.guard';
import { MembershipCheckoutComponent } from './membership/membership-checkout.component';
import { HomePage } from './pages/home-page/home-page';
import { UserBookingsComponent } from './user/user-bookings/user-bookings.component';
import { UserDashboardComponent } from './user/user-dashboard/user-dashboard.component';
import { UserLoginComponent } from './user/user-login/user-login.component';
import { UserMembershipsComponent } from './user/user-memberships/user-memberships.component';
import { UserProfileComponent } from './user/user-profile/user-profile.component';
import { UserRegisterComponent } from './user/user-register/user-register.component';
import { UserShellComponent } from './user/user-shell/user-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'login',
    component: UserLoginComponent,
  },
  {
    path: 'register',
    component: UserRegisterComponent,
  },
  {
    path: 'admin/login',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'membership/checkout/:packageId',
    component: MembershipCheckoutComponent,
    canActivate: [userAuthGuard],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminAuthGuard],
    canActivateChild: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'pricing', component: AdminPricingComponent },
      { path: 'trainers', component: AdminTrainersComponent },
      { path: 'services', component: AdminServicesComponent },
      { path: 'gallery', component: AdminGalleryComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'memberships', component: AdminMembershipsComponent },
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
    component: UserShellComponent,
    canActivate: [userAuthGuard],
    canActivateChild: [userAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'bookings', component: UserBookingsComponent },
      { path: 'memberships', component: UserMembershipsComponent },
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
      { path: 'profile', component: UserProfileComponent },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
