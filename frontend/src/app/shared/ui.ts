import { Component, computed, inject, input } from '@angular/core';
import { I18nService, TranslatePipe } from '../core/i18n.service';
import { Reservation } from '../core/models';

/** Status badge that also tells "in progress" and "finished" apart from plain "confirmed". */
@Component({
  selector: 'app-status',
  imports: [TranslatePipe],
  template: `<span [class]="'badge badge-' + state().toLowerCase()">{{ key() | t }}</span>`,
})
export class StatusBadge {
  readonly reservation = input.required<Reservation>();
  readonly now = input<number>(Date.now());

  protected readonly state = computed(() => {
    const r = this.reservation();
    if (r.status === 'CANCELLED') return 'CANCELLED';
    const now = this.now();
    if (new Date(r.endAt).getTime() <= now) return 'DONE';
    if (new Date(r.startAt).getTime() <= now) return 'ONGOING';
    return 'CONFIRMED';
  });

  protected readonly key = computed(() => `status.${this.state()}` as const);
}

/** "Tue 18 Nov, 09:00 – 10:30" */
@Component({
  selector: 'app-when',
  template: `<time [attr.datetime]="start()">{{ text() }}</time>`,
})
export class WhenText {
  private readonly i18n = inject(I18nService);
  readonly start = input.required<string>();
  readonly end = input.required<string>();
  protected readonly text = computed(
    () => `${this.i18n.dateTime(this.start())} – ${this.i18n.time(this.end())}`,
  );
}
