import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="auth-card card">
      <h1>{{ 'auth.registerTitle' | t }}</h1>
      <p class="muted">{{ 'auth.registerSubtitle' | t }}</p>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          {{ 'auth.fullName' | t }}
          <input formControlName="fullName" autocomplete="name" required maxlength="80" />
        </label>
        <label>
          {{ 'auth.email' | t }}
          <input type="email" formControlName="email" autocomplete="email" required />
        </label>
        <label>
          {{ 'auth.password' | t }}
          <input
            type="password"
            formControlName="password"
            autocomplete="new-password"
            required
            aria-describedby="pw-hint"
          />
          <small
            id="pw-hint"
            class="muted"
            [class.invalid]="form.controls.password.touched && form.controls.password.invalid"
          >
            {{ 'auth.passwordHint' | t }}
          </small>
        </label>
        @if (error()) {
          <p class="alert alert-error" role="alert">{{ error() }}</p>
        }
        <button class="btn wide" type="submit" [disabled]="busy()">
          {{ 'auth.register' | t }}
        </button>
      </form>
      <p class="muted small">
        {{ 'auth.hasAccount' | t }} <a routerLink="/login">{{ 'auth.login' | t }}</a>
      </p>
    </section>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  protected readonly busy = signal(false);
  protected readonly error = signal('');
  // Same rules as the API: 8-72 characters, at least one letter and one digit.
  protected readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.form.controls.password.invalid && this.form.controls.password.value
          ? this.i18n.t('auth.passwordHint')
          : this.i18n.t('common.required'),
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const { fullName, email, password } = this.form.getRawValue();
    this.auth.register(fullName.trim(), email.trim(), password).subscribe({
      next: () => void this.router.navigateByUrl('/rooms'),
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(this.i18n.error(err));
      },
    });
  }
}
