import { HttpErrorResponse } from '@angular/common/http';
import { Problem } from './models';

/** Turns any HTTP error into a short message for the user. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'network';
    }
    const problem = error.error as Problem | null;
    if (problem?.errors) {
      return Object.entries(problem.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(' · ');
    }
    if (problem?.detail) {
      return problem.detail;
    }
  }
  return fallback;
}
