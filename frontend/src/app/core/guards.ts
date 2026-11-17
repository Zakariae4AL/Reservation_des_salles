import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { next: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn()
    ? inject(Router).createUrlTree([auth.isAdmin() ? '/admin' : '/rooms'])
    : true;
};

/** The API enforces the role too; this guard only keeps users away from screens they can't use. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    return inject(Router).createUrlTree(['/login']);
  }
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/rooms']);
};
