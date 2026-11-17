import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from './models';
import { safeStorage } from './storage';

const TOKEN_KEY = 'salles.token';
const EXPIRES_KEY = 'salles.expiresAt';

/** Holds the session (JWT + current user) as signals. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.storedToken());
  private readonly userSignal = signal<User | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.tokenSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

  /** Runs once at startup: reloads the user behind a stored token, or drops a dead token. */
  async restore(): Promise<void> {
    if (!this.tokenSignal()) {
      return;
    }
    try {
      this.userSignal.set(await firstValueFrom(this.api.me()));
    } catch {
      this.clear();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.login({ email, password }).pipe(tap((res) => this.start(res)));
  }

  register(fullName: string, email: string, password: string): Observable<AuthResponse> {
    return this.api.register({ fullName, email, password }).pipe(tap((res) => this.start(res)));
  }

  logout(): void {
    this.clear();
    void this.router.navigateByUrl('/login');
  }

  /** Called by the interceptor when the API answers 401 (expired or revoked token). */
  sessionExpired(): void {
    if (this.tokenSignal()) {
      this.clear();
      void this.router.navigate(['/login'], { queryParams: { expired: 1 } });
    }
  }

  private start(res: AuthResponse): void {
    safeStorage.set(TOKEN_KEY, res.token);
    safeStorage.set(EXPIRES_KEY, String(Date.now() + res.expiresInSeconds * 1000));
    this.tokenSignal.set(res.token);
    this.userSignal.set(res.user);
  }

  private clear(): void {
    safeStorage.remove(TOKEN_KEY);
    safeStorage.remove(EXPIRES_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private storedToken(): string | null {
    const token = safeStorage.get(TOKEN_KEY);
    const expiresAt = Number(safeStorage.get(EXPIRES_KEY));
    if (!token || !expiresAt || expiresAt <= Date.now()) {
      safeStorage.remove(TOKEN_KEY);
      safeStorage.remove(EXPIRES_KEY);
      return null;
    }
    return token;
  }
}
