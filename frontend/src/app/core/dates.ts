/** Today's date as yyyy-MM-dd in the browser's time zone (for <input type="date">). */
export function todayInput(now = new Date()): string {
  return toDateInput(now);
}

export function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Combines a local date (yyyy-MM-dd) and time (HH:mm) into an ISO-8601 UTC instant. */
export function toInstant(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0).toISOString();
}

/** Splits an ISO instant into local date and time inputs. */
export function fromInstant(iso: string): { date: string; time: string } {
  const value = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: toDateInput(value), time: `${pad(value.getHours())}:${pad(value.getMinutes())}` };
}

export function isPast(iso: string, now = Date.now()): boolean {
  return new Date(iso).getTime() <= now;
}
