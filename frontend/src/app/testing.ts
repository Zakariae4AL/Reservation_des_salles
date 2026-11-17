import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { AuthResponse, Reservation, Room, User } from './core/models';

export const API = '/api/v1';

export function setup(): HttpTestingController {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return TestBed.inject(HttpTestingController);
}

export const user: User = {
  id: 2,
  fullName: 'Sara Benali',
  email: 'user@salles.dev',
  role: 'USER',
};
export const admin: User = {
  id: 1,
  fullName: 'Admin Salles',
  email: 'admin@salles.dev',
  role: 'ADMIN',
};

export function authResponse(who: User = user): AuthResponse {
  return { token: `token-${who.id}`, expiresInSeconds: 3600, user: who };
}

export function room(overrides: Partial<Room> = {}): Room {
  return {
    id: 1,
    name: 'A101',
    capacity: 12,
    location: 'Building A',
    equipment: ['Projector'],
    active: true,
    ...overrides,
  };
}

export function reservation(overrides: Partial<Reservation> = {}): Reservation {
  const start = new Date(Date.now() + 24 * 3600_000);
  return {
    id: 1,
    room: { id: 1, name: 'A101' },
    owner: { id: user.id, fullName: user.fullName, email: user.email },
    title: 'Weekly sync',
    attendees: 4,
    startAt: start.toISOString(),
    endAt: new Date(start.getTime() + 3600_000).toISOString(),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Lets pending microtasks (promises, signal effects) run. */
export async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await TestBed.inject(ApplicationRef).whenStable();
}
