import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { isPast } from '../../core/dates';
import { I18nService, TranslatePipe } from '../../core/i18n.service';
import { Reservation, ReservationStatus } from '../../core/models';
import { ConfirmService } from '../../shared/confirm.service';
import { ToastService } from '../../shared/toast.service';
import { StatusBadge, WhenText } from '../../shared/ui';

@Component({
  selector: 'app-admin-reservations',
  imports: [TranslatePipe, StatusBadge, WhenText],
  template: `
    <header class="page-head">
      <h1>{{ 'adminRes.title' | t }}</h1>
      <div class="segmented" role="group" [attr.aria-label]="'table.status' | t">
        @for (option of filters; track option.label) {
          <button
            type="button"
            [class.active]="status() === option.value"
            [attr.aria-pressed]="status() === option.value"
            (click)="filter(option.value)"
          >
            {{ option.label | t }}
          </button>
        }
      </div>
    </header>

    @if (loading()) {
      <p class="muted">{{ 'common.loading' | t }}</p>
    } @else {
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{{ 'table.room' | t }}</th>
              <th scope="col">{{ 'table.title' | t }}</th>
              <th scope="col">{{ 'table.when' | t }}</th>
              <th scope="col">{{ 'adminRes.owner' | t }}</th>
              <th scope="col">{{ 'table.people' | t }}</th>
              <th scope="col">{{ 'table.status' | t }}</th>
              <th scope="col">
                <span class="sr-only">{{ 'table.actions' | t }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (r of reservations(); track r.id) {
              <tr>
                <td>
                  <strong>{{ r.room.name }}</strong>
                </td>
                <td>{{ r.title }}</td>
                <td><app-when [start]="r.startAt" [end]="r.endAt" /></td>
                <td>
                  {{ r.owner.fullName }}<br /><span class="muted small">{{ r.owner.email }}</span>
                </td>
                <td>{{ r.attendees }}</td>
                <td><app-status [reservation]="r" /></td>
                <td class="actions">
                  @if (r.status === 'CONFIRMED' && !ended(r)) {
                    <button type="button" class="btn-ghost danger-text" (click)="cancel(r)">
                      {{ 'mine.cancel' | t }}
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="muted">—</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminReservationsPage {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly filters: { label: string; value: ReservationStatus | undefined }[] = [
    { label: 'adminRes.all', value: undefined },
    { label: 'status.CONFIRMED', value: 'CONFIRMED' },
    { label: 'status.CANCELLED', value: 'CANCELLED' },
  ];
  protected readonly status = signal<ReservationStatus | undefined>(undefined);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.load();
  }

  filter(status: ReservationStatus | undefined): void {
    this.status.set(status);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.allReservations(this.status()).subscribe({
      next: (list) => {
        this.reservations.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(this.i18n.error(err));
      },
    });
  }

  protected ended(r: Reservation): boolean {
    return isPast(r.endAt);
  }

  async cancel(r: Reservation): Promise<void> {
    const ok = await this.confirm.ask(
      this.i18n.t('mine.cancelConfirm', { title: r.title }),
      this.i18n.t('mine.cancel'),
    );
    if (!ok) return;
    this.api.cancel(r.id).subscribe({
      next: (updated) => {
        this.reservations.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.toast.success(this.i18n.t('mine.cancelled'));
      },
      error: (err: unknown) => this.toast.error(this.i18n.error(err)),
    });
  }
}
