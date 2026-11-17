import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { isPast } from '../core/dates';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-profile',
  imports: [TranslatePipe],
  template: `
    <h1>{{ 'profile.title' | t }}</h1>
    @if (auth.user(); as user) {
      <section class="card profile">
        <div class="avatar" aria-hidden="true">{{ initials() }}</div>
        <div>
          <h2>{{ user.fullName }}</h2>
          <p class="muted">{{ user.email }}</p>
          <p>
            <span class="pill">{{ 'profile.role' | t }}: {{ 'role.' + user.role | t }}</span>
          </p>
          <p class="muted small">{{ 'profile.stats' | t: { count: upcoming() } }}</p>
        </div>
      </section>
    }
  `,
})
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  protected readonly upcoming = signal(0);
  protected readonly initials = computed(() =>
    (this.auth.user()?.fullName ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join(''),
  );

  constructor() {
    inject(ApiService)
      .myReservations()
      .subscribe((list) =>
        this.upcoming.set(list.filter((r) => r.status === 'CONFIRMED' && !isPast(r.endAt)).length),
      );
  }
}
