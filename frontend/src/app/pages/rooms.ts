import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { toInstant, todayInput } from '../core/dates';
import { I18nService, TranslatePipe } from '../core/i18n.service';
import { Room } from '../core/models';
import { ToastService } from '../shared/toast.service';

interface Slot {
  from: string;
  to: string;
}

/** Next full hour from now, as "HH:00" (clamped to 08:00–20:00 for a sensible default). */
function defaultStart(now = new Date()): string {
  const hour = Math.min(Math.max(now.getHours() + 1, 8), 20);
  return `${String(hour).padStart(2, '0')}:00`;
}

function plusOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Component({
  selector: 'app-rooms',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <header class="page-head">
      <div>
        <h1>{{ 'rooms.title' | t }}</h1>
        <p class="muted">{{ 'rooms.subtitle' | t }}</p>
      </div>
    </header>

    <form class="card filters" [formGroup]="search" (ngSubmit)="find()" novalidate>
      <label
        >{{ 'rooms.date' | t }}<input type="date" formControlName="date" [min]="today" required
      /></label>
      <label
        >{{ 'rooms.start' | t }}<input type="time" formControlName="start" step="900" required
      /></label>
      <label
        >{{ 'rooms.end' | t }}<input type="time" formControlName="end" step="900" required
      /></label>
      <label
        >{{ 'rooms.capacity' | t }}<input type="number" formControlName="people" min="1" max="1000"
      /></label>
      <label
        >{{ 'rooms.equipment' | t
        }}<input formControlName="equipment" [placeholder]="'rooms.equipmentPlaceholder' | t"
      /></label>
      <button class="btn" type="submit" [disabled]="loading()">{{ 'rooms.search' | t }}</button>
    </form>

    @if (error()) {
      <p class="alert alert-error" role="alert">{{ error() }}</p>
    }

    @if (slot(); as current) {
      <p class="muted small" aria-live="polite">
        {{ 'rooms.free' | t: { start: i18n.dateTime(current.from), end: i18n.time(current.to) } }}
      </p>
    }

    @if (loading()) {
      <p class="muted">{{ 'common.loading' | t }}</p>
    } @else if (searched() && rooms().length === 0) {
      <div class="empty card">{{ 'rooms.none' | t }}</div>
    } @else {
      <ul class="room-grid">
        @for (room of rooms(); track room.id) {
          <li class="card room-card">
            <div class="room-top">
              <h2>{{ room.name }}</h2>
              <span class="pill">{{ 'rooms.seats' | t: { count: room.capacity } }}</span>
            </div>
            @if (room.location) {
              <p class="muted small">{{ room.location }}</p>
            }
            <ul class="tags">
              @for (item of room.equipment; track item) {
                <li>{{ item }}</li>
              }
            </ul>
            <button
              type="button"
              class="btn"
              (click)="open(room)"
              [attr.data-testid]="'book-' + room.id"
            >
              {{ 'rooms.book' | t }}
            </button>
          </li>
        }
      </ul>
    }

    @if (selected(); as room) {
      <div class="backdrop" (click)="close()"></div>
      <section class="panel card" role="dialog" aria-modal="true" aria-labelledby="book-title">
        <h2 id="book-title">{{ 'book.title' | t: { room: room.name } }}</h2>
        @if (slot(); as current) {
          <p class="muted">{{ i18n.dateTime(current.from) }} – {{ i18n.time(current.to) }}</p>
        }
        <form [formGroup]="booking" (ngSubmit)="confirm(room)" novalidate>
          <label
            >{{ 'book.meeting' | t }}<input formControlName="title" maxlength="100" required
          /></label>
          <label
            >{{ 'book.attendees' | t
            }}<input
              type="number"
              formControlName="attendees"
              min="1"
              [max]="room.capacity"
              required
          /></label>
          @if (bookingError()) {
            <p class="alert alert-error" role="alert">{{ bookingError() }}</p>
          }
          <div class="row-end">
            <button type="button" class="btn-ghost" (click)="close()">
              {{ 'book.cancel' | t }}
            </button>
            <button type="submit" class="btn" [disabled]="saving()">
              {{ 'book.confirm' | t }}
            </button>
          </div>
        </form>
      </section>
    }
  `,
})
export class RoomsPage {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly i18n = inject(I18nService);

  protected readonly today = todayInput();
  protected readonly rooms = signal<Room[]>([]);
  protected readonly loading = signal(false);
  protected readonly searched = signal(false);
  protected readonly error = signal('');
  protected readonly slot = signal<Slot | null>(null);
  protected readonly selected = signal<Room | null>(null);
  protected readonly saving = signal(false);
  protected readonly bookingError = signal('');

  private readonly start = defaultStart();
  protected readonly search = this.fb.group({
    date: [this.today, Validators.required],
    start: [this.start, Validators.required],
    end: [plusOneHour(this.start), Validators.required],
    people: [1, [Validators.min(1), Validators.max(1000)]],
    equipment: [''],
  });

  protected readonly booking = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    attendees: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.find();
  }

  find(): void {
    const { date, start, end, people, equipment } = this.search.getRawValue();
    if (this.search.invalid || !date || !start || !end) {
      this.error.set(this.i18n.t('common.required'));
      return;
    }
    const from = toInstant(date, start);
    const to = toInstant(date, end);
    if (to <= from) {
      this.error.set(this.i18n.t('rooms.endAfterStart'));
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.slot.set({ from, to });
    this.api
      .rooms({ from, to, minCapacity: people || null, equipment: equipment.trim() || null })
      .subscribe({
        next: (rooms) => {
          this.rooms.set(rooms);
          this.loading.set(false);
          this.searched.set(true);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.rooms.set([]);
          this.error.set(this.i18n.error(err));
        },
      });
  }

  open(room: Room): void {
    this.booking.reset({
      title: '',
      attendees: Math.min(this.search.controls.people.value || 1, room.capacity),
    });
    this.booking.controls.attendees.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(room.capacity),
    ]);
    this.bookingError.set('');
    this.selected.set(room);
  }

  close(): void {
    this.selected.set(null);
  }

  confirm(room: Room): void {
    const slot = this.slot();
    if (this.booking.invalid || !slot) {
      this.booking.markAllAsTouched();
      this.bookingError.set(this.i18n.t('common.required'));
      return;
    }
    const { title, attendees } = this.booking.getRawValue();
    this.saving.set(true);
    this.api
      .book({ roomId: room.id, title: title.trim(), attendees, startAt: slot.from, endAt: slot.to })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.selected.set(null);
          this.toast.success(this.i18n.t('rooms.booked', { room: room.name }));
          this.find();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.bookingError.set(this.i18n.error(err));
        },
      });
  }
}
