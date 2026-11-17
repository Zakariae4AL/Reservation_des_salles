import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';
import { ConfirmService } from '../shared/confirm.service';
import { API, admin, authResponse, setup, user } from '../testing';
import { Shell } from './shell';

describe('Shell', () => {
  beforeEach(() => localStorage.clear());

  async function render(who?: typeof user) {
    const http = setup();
    TestBed.inject(I18nService).lang.set('en');
    if (who) {
      const done = firstValueFrom(TestBed.inject(AuthService).login(who.email, 'Demo1234'));
      http.expectOne(`${API}/auth/login`).flush(authResponse(who));
      await done;
    }
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the admin links to admins only', async () => {
    const asUser = await render(user);
    expect(asUser.nativeElement.textContent).not.toContain('Dashboard');
    TestBed.resetTestingModule();
    localStorage.clear();
    const asAdmin = await render(admin);
    expect(asAdmin.nativeElement.textContent).toContain('Dashboard');
    expect(asAdmin.nativeElement.textContent).toContain('All reservations');
  });

  it('switches the interface to French and remembers it', async () => {
    const fixture = await render(user);
    (fixture.nativeElement.querySelector('[data-testid=lang]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Mes réservations');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem('salles.lang')).toBe('fr');
  });

  it('resolves the confirm dialog with the button the user picks', async () => {
    const fixture = await render(user);
    const answer = TestBed.inject(ConfirmService).ask('Delete room A101?', 'Delete');
    await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.textContent).toContain('Delete room A101?');
    (dialog.querySelector('[data-testid=confirm]') as HTMLButtonElement).click();
    await expect(answer).resolves.toBe(true);
  });
});
