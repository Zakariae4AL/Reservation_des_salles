import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Adds the Bearer token to API calls only (never to third-party URLs) and handles expired sessions. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApi = req.url.startsWith(environment.apiUrl);
  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  const request =
    isApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isApi && !isAuthCall && error instanceof HttpErrorResponse && error.status === 401) {
        auth.sessionExpired();
      }
      return throwError(() => error);
    }),
  );
};
