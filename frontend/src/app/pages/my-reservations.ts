import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { isPast } from '../core/dates';
import { I18nService, TranslatePipe } from '../core/i18n.service';
import { Reservation } from '../core/models';
import { ConfirmService } from '../shared/confirm.service';
import { ToastService } from '../shared/toast.service';
import { StatusBadge, WhenText } from '../shared/ui';

@Component({
  selector: 'app-my-reservations',
  imports: [RouterLink, TranslatePipe, StatusBadge, WhenText],
  template: `
    <header class="page-head">
      <h1>{{ 'mine.title' | t }}</h1>
      <a class="btn" routerLink="/rooms">{{ 'mine.bookOne' | t }}</a>
    </header>

    @if (loading()) {
      <p class="muted">{{ 'common.loading' | t }}</p>
    } @else if (error()) {
      <p class="alert alert-error" role="alert">
        {{ error() }} <button class="btn-ghost" (click)="load()">{{ 'common.retry' | t }}</button>
      </p>
    } @else if (all().length === 0) {
      <div class="empty card">{{ 'mine.empty' | t }}</div>
    } @else {
      <h2 class="section-title">
        {{ 'mine.upcoming' | t }} <span class="count">{{ upcoming().length }}</span>
      </h2>
      <ul class="list">
        @for (r of upcoming(); track r.id) {
          <li class="card list-item">
            <div>
              <strong>{{ r.title }}</strong>
              <p class="muted small">
                {{ r.room.name }} · <app-when [start]="r.startAt" [end]="r.endAt" /> ·
                {{ r.attendees }} 👤
              </p>
            </div>
            <div class="row-end">
              <app-status [reservation]="r" />
              @if (!started(r)) {
                <button
                  type="button"
                  class="btn-ghost danger-text"
                  (click)="cancel(r)"
                  [attr.data-testid]="'cancel-' + r.id"
                >
                  {{ 'mine.cancel' | t }}
                </button>
              }
            </div>
          </li>
        }
      </ul>

      @if (history().length) {
        <h2 class="section-title">
          {{ 'mine.past' | t }} <span class="count">{{ history().length }}</span>
        </h2>
        <ul class="list faded">
          @for (r of history(); track r.id) {
            <li class="card list-item">
              <div>
                <strong>{{ r.title }}</strong>
                <p class="muted small">
                  {{ r.room.name }} · <app-when [start]="r.startAt" [end]="r.endAt" />
                </p>
              </div>
              <app-status [reservation]="r" />
            </li>
          }
        </ul>
      }
    }
  `,
})
export class MyReservationsPage {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly all = signal<Reservation[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly upcoming = computed(() =>
    this.all()
      .filter((r) => r.status === 'CONFIRMED' && !isPast(r.endAt))
      .sort((a, b) => a.startAt.localeCompare(b.startAt)),
  );
  protected readonly history = computed(() =>
    this.all()
      .filter((r) => r.status === 'CANCELLED' || isPast(r.endAt))
      .sort((a, b) => b.startAt.localeCompare(a.startAt)),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.myReservations().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.i18n.error(err));
        this.loading.set(false);
      },
    });
  }

  protected started(r: Reservation): boolean {
    return isPast(r.startAt);
  }

  async cancel(r: Reservation): Promise<void> {
    const ok = await this.confirmService.ask(
      this.i18n.t('mine.cancelConfirm', { title: r.title }),
      this.i18n.t('mine.cancel'),
    );
    if (!ok) return;
    this.api.cancel(r.id).subscribe({
      next: (updated) => {
        this.all.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
        this.toast.success(this.i18n.t('mine.cancelled'));
      },
      error: (err: unknown) => this.toast.error(this.i18n.error(err)),
    });
  }
}
