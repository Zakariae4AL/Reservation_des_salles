import { HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API, admin, authResponse, setup, user } from '../testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    http = setup();
  });

  afterEach(() => http.verify());

  it('stores the session after login and exposes the role', async () => {
    const auth = TestBed.inject(AuthService);
    const done = firstValueFrom(auth.login('admin@salles.dev', 'Demo1234'));
    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.body).toEqual({ email: 'admin@salles.dev', password: 'Demo1234' });
    req.flush(authResponse(admin));
    await done;

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(localStorage.getItem('salles.token')).toBe('token-1');
  });

  it('never sends a role when registering', async () => {
    const auth = TestBed.inject(AuthService);
    const done = firstValueFrom(auth.register('Sara', 'sara@example.com', 'Secret123'));
    const req = http.expectOne(`${API}/auth/register`);
    expect(req.request.body).toEqual({
      fullName: 'Sara',
      email: 'sara@example.com',
      password: 'Secret123',
    });
    req.flush(authResponse(user));
    await done;
    expect(auth.user()?.role).toBe('USER');
  });

  it('restores a stored session through /auth/me', async () => {
    localStorage.setItem('salles.token', 'stored');
    localStorage.setItem('salles.expiresAt', String(Date.now() + 60_000));
    const auth = TestBed.inject(AuthService);
    const done = auth.restore();
    const req = http.expectOne(`${API}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer stored');
    req.flush(user);
    await done;
    expect(auth.user()).toEqual(user);
  });

  it('drops a token the API rejects', async () => {
    localStorage.setItem('salles.token', 'revoked');
    localStorage.setItem('salles.expiresAt', String(Date.now() + 60_000));
    const auth = TestBed.inject(AuthService);
    const done = auth.restore();
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await done;
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('salles.token')).toBeNull();
  });

  it('ignores an expired stored token without calling the API', async () => {
    localStorage.setItem('salles.token', 'old');
    localStorage.setItem('salles.expiresAt', String(Date.now() - 1));
    const auth = TestBed.inject(AuthService);
    await auth.restore();
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('logs out and goes back to the login page', async () => {
    const auth = TestBed.inject(AuthService);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const done = firstValueFrom(auth.login('user@salles.dev', 'Demo1234'));
    http.expectOne(`${API}/auth/login`).flush(authResponse());
    await done;

    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('salles.token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});

describe('authInterceptor', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    http = setup();
    const done = firstValueFrom(TestBed.inject(AuthService).login('user@salles.dev', 'Demo1234'));
    http.expectOne(`${API}/auth/login`).flush(authResponse());
    await done;
  });

  afterEach(() => http.verify());

  it('adds the token to API calls only', () => {
    const client = TestBed.inject(HttpClient);
    client.get(`${API}/rooms`).subscribe();
    client.get('https://example.com/other').subscribe();

    expect(http.expectOne(`${API}/rooms`).request.headers.get('Authorization')).toBe(
      'Bearer token-2',
    );
    expect(http.expectOne('https://example.com/other').request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('ends the session when the API answers 401', () => {
    const auth = TestBed.inject(AuthService);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(HttpClient)
      .get(`${API}/reservations/mine`)
      .subscribe({ error: () => undefined });
    http
      .expectOne(`${API}/reservations/mine`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expired: 1 } });
  });

  it('keeps the session on 403', () => {
    TestBed.inject(HttpClient)
      .get(`${API}/admin/stats`)
      .subscribe({ error: () => undefined });
    http.expectOne(`${API}/admin/stats`).flush(null, { status: 403, statusText: 'Forbidden' });
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
  });
});
