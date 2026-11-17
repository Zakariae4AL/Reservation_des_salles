import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API, admin, authResponse, setup, user } from '../testing';
import { AuthService } from './auth.service';

describe('route guards', () => {
  beforeEach(() => localStorage.clear());

  async function loginAs(who: typeof user) {
    const http = setup();
    const done = firstValueFrom(TestBed.inject(AuthService).login(who.email, 'Demo1234'));
    http.expectOne(`${API}/auth/login`).flush(authResponse(who));
    await done;
    return TestBed.inject(Router);
  }

  it('sends visitors to the login page and remembers where they were going', async () => {
    setup();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/reservations');
    expect(router.url).toBe('/login?next=%2Freservations');
  });

  it('keeps regular users out of the admin area', async () => {
    const router = await loginAs(user);
    await router.navigateByUrl('/admin/rooms');
    expect(router.url).toBe('/rooms');
  });

  it('lets admins in and sends signed-in people away from the login page', async () => {
    const router = await loginAs(admin);
    await router.navigateByUrl('/admin/rooms');
    expect(router.url).toBe('/admin/rooms');
    await router.navigateByUrl('/login');
    expect(router.url).toBe('/admin');
  });
});
