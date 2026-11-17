import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService, TranslatePipe } from '../core/i18n.service';
import { ThemeService } from '../core/theme.service';
import { ConfirmService } from '../shared/confirm.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <a class="skip-link" href="#main">{{ 'nav.skip' | t }}</a>
    <header class="topbar">
      <a class="brand" [routerLink]="auth.isAdmin() ? '/admin' : '/rooms'">
        <span class="brand-mark" aria-hidden="true">S</span>{{ 'app.name' | t }}
      </a>
      @if (auth.isLoggedIn()) {
        <nav [attr.aria-label]="'nav.menu' | t">
          @if (auth.isAdmin()) {
            <a
              routerLink="/admin"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >{{ 'nav.dashboard' | t }}</a
            >
            <a routerLink="/admin/rooms" routerLinkActive="active">{{ 'nav.adminRooms' | t }}</a>
            <a routerLink="/admin/reservations" routerLinkActive="active">{{
              'nav.adminReservations' | t
            }}</a>
          }
          <a routerLink="/rooms" routerLinkActive="active">{{ 'nav.rooms' | t }}</a>
          <a routerLink="/reservations" routerLinkActive="active">{{ 'nav.mine' | t }}</a>
          <a routerLink="/profile" routerLinkActive="active">{{ 'nav.profile' | t }}</a>
        </nav>
      }
      <div class="topbar-tools">
        <button type="button" class="btn-ghost" (click)="i18n.toggle()" data-testid="lang">
          {{ 'nav.lang' | t }}
        </button>
        <button
          type="button"
          class="btn-ghost icon"
          (click)="theme.toggle()"
          [attr.aria-label]="'nav.theme' | t"
        >
          {{ theme.theme() === 'dark' ? '☀' : '☾' }}
        </button>
        @if (auth.isLoggedIn()) {
          <button type="button" class="btn-ghost" (click)="auth.logout()">
            {{ 'nav.logout' | t }}
          </button>
        }
      </div>
    </header>

    <main id="main" tabindex="-1">
      <router-outlet />
    </main>

    <div class="toasts" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class.toast-error]="toast.kind === 'error'">
          <span>{{ toast.text }}</span>
          <button type="button" aria-label="×" (click)="toasts.dismiss(toast.id)">×</button>
        </div>
      }
    </div>

    <dialog
      #confirmDialog
      class="dialog"
      (close)="confirm.answer(false)"
      aria-labelledby="confirm-text"
    >
      @if (confirm.pending(); as pending) {
        <p id="confirm-text">{{ pending.message }}</p>
        <div class="row-end">
          <button type="button" class="btn-ghost" (click)="confirm.answer(false)">
            {{ 'book.cancel' | t }}
          </button>
          <button
            type="button"
            class="btn danger"
            (click)="confirm.answer(true)"
            data-testid="confirm"
          >
            {{ pending.confirmLabel }}
          </button>
        </div>
      }
    </dialog>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  protected readonly toasts = inject(ToastService);
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('confirmDialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      const open = this.confirm.pending() !== null;
      // jsdom has no showModal(); fall back to the open attribute there.
      if (open && !dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      } else if (!open && dialog.open) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
    });
  }
}
