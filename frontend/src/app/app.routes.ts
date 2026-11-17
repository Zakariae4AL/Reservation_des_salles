import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'rooms' },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Salles',
    loadComponent: () => import('./pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Register · Salles',
    loadComponent: () => import('./pages/register').then((m) => m.RegisterPage),
  },
  {
    path: 'rooms',
    canActivate: [authGuard],
    title: 'Book a room · Salles',
    loadComponent: () => import('./pages/rooms').then((m) => m.RoomsPage),
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    title: 'My reservations · Salles',
    loadComponent: () => import('./pages/my-reservations').then((m) => m.MyReservationsPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    title: 'Profile · Salles',
    loadComponent: () => import('./pages/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        title: 'Dashboard · Salles',
        loadComponent: () => import('./pages/admin/dashboard').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'rooms',
        title: 'Rooms · Salles',
        loadComponent: () => import('./pages/admin/admin-rooms').then((m) => m.AdminRoomsPage),
      },
      {
        path: 'reservations',
        title: 'Reservations · Salles',
        loadComponent: () =>
          import('./pages/admin/admin-reservations').then((m) => m.AdminReservationsPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found · Salles',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage),
  },
];
