import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';

/** Only follow `?next=` to a page inside the app (no open redirect). */
export function safeNext(next: string | null | undefined, fallback: string): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="auth-card card">
      <h1>{{ 'auth.loginTitle' | t }}</h1>
      <p class="muted">{{ 'auth.loginSubtitle' | t }}</p>
      @if (expired) {
        <p class="alert" role="alert">{{ 'auth.expired' | t }}</p>
      }
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          {{ 'auth.email' | t }}
          <input type="email" formControlName="email" autocomplete="email" required />
        </label>
        <label>
          {{ 'auth.password' | t }}
          <input
            type="password"
            formControlName="password"
            autocomplete="current-password"
            required
          />
        </label>
        @if (error()) {
          <p class="alert alert-error" role="alert">{{ error() }}</p>
        }
        <button class="btn wide" type="submit" [disabled]="busy()">{{ 'auth.login' | t }}</button>
      </form>
      <p class="muted small">
        {{ 'auth.noAccount' | t }} <a routerLink="/register">{{ 'auth.register' | t }}</a>
      </p>
      <p class="hint">
        {{
          'auth.demo'
            | t: { admin: 'admin@salles.dev', user: 'user@salles.dev', password: 'Demo1234' }
        }}
      </p>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  protected readonly expired = this.route.snapshot.queryParamMap.has('expired');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(this.i18n.t('common.required'));
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        const home = res.user.role === 'ADMIN' ? '/admin' : '/rooms';
        void this.router.navigateByUrl(
          safeNext(this.route.snapshot.queryParamMap.get('next'), home),
        );
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(this.i18n.error(err));
      },
    });
  }
}
