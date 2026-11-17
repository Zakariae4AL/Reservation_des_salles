import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { safeNext } from '../pages/login';
import { parseEquipment } from '../pages/admin/admin-rooms';
import { fromInstant, isPast, toInstant } from './dates';
import { errorMessage } from './errors';
import { I18nService } from './i18n.service';
import { translations } from './translations';

describe('dates', () => {
  it('round-trips a local date and time through an ISO instant', () => {
    const iso = toInstant('2026-12-01', '09:30');
    expect(new Date(iso).getHours()).toBe(9);
    expect(fromInstant(iso)).toEqual({ date: '2026-12-01', time: '09:30' });
  });

  it('knows past from future', () => {
    expect(isPast('2000-01-01T00:00:00Z')).toBe(true);
    expect(isPast(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
});

describe('errorMessage', () => {
  it('prefers validation errors, then the problem detail, then the fallback', () => {
    const validation = new HttpErrorResponse({
      status: 400,
      error: { errors: { title: 'must not be blank' } },
    });
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { detail: 'This room is already booked during that time.' },
    });
    expect(errorMessage(validation, 'x')).toBe('title: must not be blank');
    expect(errorMessage(conflict, 'x')).toBe('This room is already booked during that time.');
    expect(errorMessage(new HttpErrorResponse({ status: 500 }), 'fallback')).toBe('fallback');
    expect(errorMessage(new HttpErrorResponse({ status: 0 }), 'x')).toBe('network');
  });
});

describe('I18nService', () => {
  beforeEach(() => localStorage.clear());

  it('translates with parameters and switches language', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.lang.set('en');
    expect(i18n.t('rooms.seats', { count: 12 })).toBe('12 seats');
    i18n.toggle();
    expect(i18n.lang()).toBe('fr');
    expect(i18n.t('rooms.seats', { count: 12 })).toBe('12 places');
  });

  it('has a French text for every English key', () => {
    const missing = Object.keys(translations.en).filter(
      (key) => !translations.fr[key as keyof typeof translations.fr],
    );
    expect(missing).toEqual([]);
  });
});

describe('helpers', () => {
  it('only follows in-app redirects', () => {
    expect(safeNext('/reservations', '/rooms')).toBe('/reservations');
    expect(safeNext('https://evil.example', '/rooms')).toBe('/rooms');
    expect(safeNext('//evil.example', '/rooms')).toBe('/rooms');
    expect(safeNext(null, '/rooms')).toBe('/rooms');
  });

  it('parses a comma-separated equipment list', () => {
    expect(parseEquipment(' Projector, whiteboard ,, TV ')).toEqual([
      'Projector',
      'whiteboard',
      'TV',
    ]);
    expect(parseEquipment('')).toEqual([]);
  });
});
