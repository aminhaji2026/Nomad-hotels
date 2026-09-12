/** UTC date-only helpers for inventory and stay nights. */

export function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new Error(`Invalid date: ${value}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive start, exclusive end (checkout). */
export function eachNight(checkIn: Date, checkOut: Date): Date[] {
  if (checkOut <= checkIn) return [];
  const nights: Date[] = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return eachNight(checkIn, checkOut).length;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export {
  parseDateOnly as parseDate,
  toDateOnlyString as formatDateOnly,
  eachNight as enumerateNights,
  nightsBetween as countNights,
};
