import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmService } from '../shared/confirm.service';
import { ToastService } from '../shared/toast.service';
import { I18nService } from '../core/i18n.service';
import { API, admin, authResponse, flush, reservation, room, setup } from '../testing';
import { AdminRoomsPage } from './admin/admin-rooms';
import { LoginPage } from './login';
import { MyReservationsPage } from './my-reservations';
import { RegisterPage } from './register';
import { RoomsPage } from './rooms';

function el(fixture: { nativeElement: HTMLElement }): HTMLElement {
  return fixture.nativeElement;
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('pages', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    http = setup();
    TestBed.inject(I18nService).lang.set('en');
  });

  afterEach(() => http.verify());

  describe('LoginPage', () => {
    it('signs in and opens the admin dashboard for an admin', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const fixture = TestBed.createComponent(LoginPage);
      await fixture.whenStable();

      type(el(fixture).querySelector('input[type=email]')!, 'admin@salles.dev');
      type(el(fixture).querySelector('input[type=password]')!, 'Demo1234');
      el(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));

      http.expectOne(`${API}/auth/login`).flush(authResponse(admin));
      expect(navigate).toHaveBeenCalledWith('/admin');
    });

    it('shows the API error on bad credentials', async () => {
      const fixture = TestBed.createComponent(LoginPage);
      await fixture.whenStable();
      type(el(fixture).querySelector('input[type=email]')!, 'user@salles.dev');
      type(el(fixture).querySelector('input[type=password]')!, 'wrong');
      el(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));

      http
        .expectOne(`${API}/auth/login`)
        .flush(
          { status: 401, detail: 'Invalid email or password.' },
          { status: 401, statusText: 'Unauthorized' },
        );
      await fixture.whenStable();
      expect(el(fixture).querySelector('[role=alert]')?.textContent).toContain(
        'Invalid email or password.',
      );
    });

    it('does not call the API with an empty form', async () => {
      const fixture = TestBed.createComponent(LoginPage);
      await fixture.whenStable();
      el(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
      http.expectNone(`${API}/auth/login`);
    });
  });

  describe('RegisterPage', () => {
    it('checks the password rules before calling the API', async () => {
      const fixture = TestBed.createComponent(RegisterPage);
      await fixture.whenStable();
      const inputs = el(fixture).querySelectorAll('input');
      type(inputs[0], 'Sara');
      type(inputs[1], 'sara@example.com');
      type(inputs[2], 'onlyletters');
      el(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      http.expectNone(`${API}/auth/register`);
      expect(el(fixture).querySelector('[role=alert]')?.textContent).toContain(
        'a letter and a digit',
      );
    });
  });

  describe('RoomsPage', () => {
    it('searches free rooms for the chosen slot and books one', async () => {
      const toast = vi.spyOn(TestBed.inject(ToastService), 'success');
      const fixture = TestBed.createComponent(RoomsPage);

      const first = http.expectOne((req) => req.url === `${API}/rooms`);
      expect(first.request.params.get('from')).toMatch(/Z$/);
      expect(first.request.params.get('to')).toMatch(/Z$/);
      expect(first.request.params.get('minCapacity')).toBe('1');
      first.flush([room(), room({ id: 2, name: 'B204', capacity: 6, equipment: ['TV screen'] })]);
      await fixture.whenStable();

      expect(el(fixture).querySelectorAll('.room-card')).toHaveLength(2);
      expect(el(fixture).textContent).toContain('12 seats');

      (el(fixture).querySelector('[data-testid=book-2]') as HTMLButtonElement).click();
      await fixture.whenStable();
      const panel = el(fixture).querySelector('[role=dialog]')!;
      expect(panel.textContent).toContain('Book B204');
      type(panel.querySelector('input')!, 'Design review');
      panel.querySelector('form')!.dispatchEvent(new Event('submit'));

      const booking = http.expectOne(`${API}/reservations`);
      expect(booking.request.body).toMatchObject({
        roomId: 2,
        title: 'Design review',
        attendees: 1,
      });
      expect(booking.request.body.startAt).toBe(first.request.params.get('from'));
      booking.flush(reservation({ room: { id: 2, name: 'B204' } }));

      expect(toast).toHaveBeenCalledWith('B204 is booked. See it in My reservations.');
      http.expectOne((req) => req.url === `${API}/rooms`).flush([room()]);
    });

    it('shows a conflict from the API inside the booking panel', async () => {
      const fixture = TestBed.createComponent(RoomsPage);
      http.expectOne((req) => req.url === `${API}/rooms`).flush([room()]);
      await fixture.whenStable();
      (el(fixture).querySelector('[data-testid=book-1]') as HTMLButtonElement).click();
      await fixture.whenStable();
      type(el(fixture).querySelector<HTMLInputElement>('[role=dialog] input')!, 'Sync');
      el(fixture).querySelector('[role=dialog] form')!.dispatchEvent(new Event('submit'));

      http
        .expectOne(`${API}/reservations`)
        .flush(
          { status: 409, detail: 'This room is already booked during that time.' },
          { status: 409, statusText: 'Conflict' },
        );
      await fixture.whenStable();
      expect(el(fixture).querySelector('[role=dialog] [role=alert]')?.textContent).toContain(
        'already booked',
      );
    });

    it('explains when no room is free', async () => {
      const fixture = TestBed.createComponent(RoomsPage);
      http.expectOne((req) => req.url === `${API}/rooms`).flush([]);
      await fixture.whenStable();
      expect(el(fixture).textContent).toContain('No room is free for this slot');
    });
  });

  describe('MyReservationsPage', () => {
    it('splits upcoming and past bookings and cancels after confirmation', async () => {
      const confirm = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);
      const fixture = TestBed.createComponent(MyReservationsPage);
      const past = reservation({
        id: 2,
        title: 'Old meeting',
        startAt: '2025-01-01T09:00:00Z',
        endAt: '2025-01-01T10:00:00Z',
      });
      http.expectOne(`${API}/reservations/mine`).flush([reservation(), past]);
      await fixture.whenStable();

      expect(el(fixture).textContent).toContain('Upcoming');
      expect(el(fixture).textContent).toContain('Past and cancelled');
      expect(el(fixture).querySelector('[data-testid=cancel-2]')).toBeNull();

      (el(fixture).querySelector('[data-testid=cancel-1]') as HTMLButtonElement).click();
      await flush();
      expect(confirm).toHaveBeenCalled();
      http.expectOne(`${API}/reservations/1/cancel`).flush(reservation({ status: 'CANCELLED' }));
      await fixture.whenStable();

      expect(el(fixture).querySelector('[data-testid=cancel-1]')).toBeNull();
      expect(el(fixture).textContent).toContain('Cancelled');
    });

    it('does nothing when the user changes their mind', async () => {
      vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(false);
      const fixture = TestBed.createComponent(MyReservationsPage);
      http.expectOne(`${API}/reservations/mine`).flush([reservation()]);
      await fixture.whenStable();
      (el(fixture).querySelector('[data-testid=cancel-1]') as HTMLButtonElement).click();
      await flush();
      http.expectNone(`${API}/reservations/1/cancel`);
    });
  });

  describe('AdminRoomsPage', () => {
    it('creates a room with a cleaned equipment list', async () => {
      const fixture = TestBed.createComponent(AdminRoomsPage);
      http.expectOne(`${API}/rooms`).flush([room()]);
      await fixture.whenStable();

      (el(fixture).querySelector('.page-head .btn') as HTMLButtonElement).click();
      await fixture.whenStable();
      const inputs = el(fixture).querySelectorAll<HTMLInputElement>('.room-form input');
      type(inputs[0], ' C300 ');
      type(inputs[1], '40');
      type(inputs[3], 'Projector, Microphone ,');
      el(fixture).querySelector('.room-form')!.dispatchEvent(new Event('submit'));

      const req = http.expectOne(`${API}/rooms`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'C300',
        capacity: 40,
        location: null,
        equipment: ['Projector', 'Microphone'],
        active: true,
      });
      req.flush(room({ id: 3, name: 'C300', capacity: 40 }));
      await fixture.whenStable();
      expect(el(fixture).querySelectorAll('tbody tr')).toHaveLength(2);
    });

    it('edits an existing room with PUT', async () => {
      const fixture = TestBed.createComponent(AdminRoomsPage);
      http.expectOne(`${API}/rooms`).flush([room()]);
      await fixture.whenStable();
      (el(fixture).querySelector('[data-testid=edit-1]') as HTMLButtonElement).click();
      await fixture.whenStable();
      const capacity = el(fixture).querySelectorAll<HTMLInputElement>('.room-form input')[1];
      expect(capacity.value).toBe('12');
      type(capacity, '14');
      el(fixture).querySelector('.room-form')!.dispatchEvent(new Event('submit'));

      const req = http.expectOne(`${API}/rooms/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.capacity).toBe(14);
      req.flush(room({ capacity: 14 }));
    });
  });
});
