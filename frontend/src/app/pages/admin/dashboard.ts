import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { isPast } from '../../core/dates';
import { I18nService, TranslatePipe } from '../../core/i18n.service';
import { Reservation, Stats, User } from '../../core/models';
import { StatusBadge, WhenText } from '../../shared/ui';

@Component({
  selector: 'app-admin-dashboard',
  imports: [TranslatePipe, StatusBadge, WhenText],
  template: `
    <h1>{{ 'admin.title' | t }}</h1>
    @if (error()) {
      <p class="alert alert-error" role="alert">{{ error() }}</p>
    }
    @if (stats(); as s) {
      <section class="stats">
        <div class="card stat">
          <span>{{ 'admin.rooms' | t }}</span><strong>{{ s.rooms }}</strong>
        </div>
        <div class="card stat">
          <span>{{ 'admin.activeRooms' | t }}</span><strong>{{ s.activeRooms }}</strong>
        </div>
        <div class="card stat">
          <span>{{ 'admin.users' | t }}</span><strong>{{ s.users }}</strong>
        </div>
        <div class="card stat accent">
          <span>{{ 'admin.upcoming' | t }}</span><strong>{{ s.upcomingReservations }}</strong>
        </div>
        <div class="card stat">
          <span>{{ 'admin.ongoing' | t }}</span><strong>{{ s.ongoingReservations }}</strong>
        </div>
      </section>
    } @else if (!error()) {
      <p class="muted">{{ 'common.loading' | t }}</p>
    }

    <div class="two-cols">
      <section>
        <h2 class="section-title">{{ 'admin.next' | t }}</h2>
        <ul class="list">
          @for (r of next(); track r.id) {
            <li class="card list-item">
              <div>
                <strong>{{ r.room.name }} · {{ r.title }}</strong>
                <p class="muted small">
                  <app-when [start]="r.startAt" [end]="r.endAt" /> · {{ r.owner.fullName }}
                </p>
              </div>
              <app-status [reservation]="r" />
            </li>
          } @empty {
            <li class="muted">—</li>
          }
        </ul>
      </section>
      <section>
        <h2 class="section-title">{{ 'admin.usersList' | t }}</h2>
        <ul class="list">
          @for (u of users(); track u.id) {
            <li class="card list-item">
              <div>
                <strong>{{ u.fullName }}</strong>
                <p class="muted small">{{ u.email }}</p>
              </div>
              <span class="pill" [class.pill-accent]="u.role === 'ADMIN'">{{
                'role.' + u.role | t
              }}</span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class AdminDashboardPage {
  private readonly i18n = inject(I18nService);
  protected readonly stats = signal<Stats | null>(null);
  protected readonly users = signal<User[]>([]);
  private readonly reservations = signal<Reservation[]>([]);
  protected readonly error = signal('');
  protected readonly next = computed(() =>
    this.reservations()
      .filter((r) => !isPast(r.endAt))
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 6),
  );

  constructor() {
    const api = inject(ApiService);
    forkJoin({
      stats: api.stats(),
      users: api.users(),
      reservations: api.allReservations('CONFIRMED'),
    }).subscribe({
      next: ({ stats, users, reservations }) => {
        this.stats.set(stats);
        this.users.set(users);
        this.reservations.set(reservations);
      },
      error: (err: unknown) => this.error.set(this.i18n.error(err)),
    });
  }
}
