import { Injectable, signal } from '@angular/core';
import { safeStorage } from './storage';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    safeStorage.set('salles.theme', next);
    this.apply(next);
  }

  private apply(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme;
  }

  private initial(): Theme {
    const saved = safeStorage.get('salles.theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
