import { DOCUMENT } from '@angular/common';
import { Injectable, Pipe, PipeTransform, effect, inject, signal } from '@angular/core';
import { errorMessage } from './errors';
import { safeStorage } from './storage';
import { Lang, TranslationKey, translations } from './translations';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  readonly lang = signal<Lang>(this.initial());

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.lang();
      safeStorage.set('salles.lang', this.lang());
    });
  }

  toggle(): void {
    this.lang.update((lang) => (lang === 'en' ? 'fr' : 'en'));
  }

  t(key: TranslationKey, params: Record<string, string | number> = {}): string {
    const text = translations[this.lang()][key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
  }

  /** A user-facing message for an HTTP error (API detail, validation errors or a network hint). */
  error(err: unknown): string {
    const message = errorMessage(err, this.t('common.error'));
    return message === 'network' ? this.t('common.network') : message;
  }

  /** "Tue 18 Nov, 09:00" in the current language. */
  dateTime(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  time(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  private locale(): string {
    return this.lang() === 'fr' ? 'fr-FR' : 'en-GB';
  }

  private initial(): Lang {
    const saved = safeStorage.get('salles.lang');
    if (saved === 'en' || saved === 'fr') {
      return saved;
    }
    return typeof navigator !== 'undefined' && navigator.language?.startsWith('fr') ? 'fr' : 'en';
  }
}

/** `{{ 'nav.rooms' | t }}` — re-renders when the language signal changes. */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey | string, params?: Record<string, string | number>): string {
    return this.i18n.t(key as TranslationKey, params);
  }
}
