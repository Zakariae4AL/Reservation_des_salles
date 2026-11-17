import { Injectable, signal } from '@angular/core';

interface PendingConfirm {
  message: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
}

/** An accessible replacement for window.confirm(), rendered by the shell. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(message: string, confirmLabel: string): Promise<boolean> {
    this.pending()?.resolve(false);
    return new Promise((resolve) => this.pending.set({ message, confirmLabel, resolve }));
  }

  answer(ok: boolean): void {
    this.pending()?.resolve(ok);
    this.pending.set(null);
  }
}
