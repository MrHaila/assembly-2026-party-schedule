/**
 * Time helpers. Europe/Helsinki is hardcoded — never the device timezone:
 * attendees arrive from abroad and the schedule is a Helsinki fact.
 *
 * All API timestamps already carry the +03:00 offset, so "Helsinki minutes"
 * for an event is just parsing the local part of its ISO string — no tz
 * conversion ever happens on event data. Conversion is only needed for
 * "now", via Intl with an explicit timeZone.
 */

export const HELSINKI_TZ = "Europe/Helsinki";

/** Verified from the data: the real day is 10:00 → 23:00. No midnight logic. */
export const DAY_START_MIN = 10 * 60;
export const DAY_END_MIN = 23 * 60;
export const DAY_LENGTH_MIN = DAY_END_MIN - DAY_START_MIN; // 780
export const SLOT_MIN = 5;
export const SLOT_COUNT = DAY_LENGTH_MIN / SLOT_MIN; // 156

/** Minutes since Helsinki midnight for an ISO timestamp's local part. */
export function helsinkiMinutes(iso: string): number {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  return h * 60 + m;
}

/** YYYY-MM-DD of an ISO timestamp's local part. */
export function isoDate(iso: string): string {
  return iso.slice(0, 10);
}

/** "HH:mm" of an ISO timestamp's local part. */
export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

export function formatTimeRange(
  start: string,
  end: string,
  estimated: boolean,
): string {
  return `${estimated ? "≈" : ""}${formatTime(start)}–${formatTime(end)}`;
}

const helsinkiPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: HELSINKI_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function helsinkiParts(date: Date) {
  const parts: Record<string, string> = {};
  for (const p of helsinkiPartsFormatter.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return parts;
}

/** Current Helsinki wall time: date + minutes since midnight. */
export function helsinkiNow(now: Date = new Date()): {
  date: string;
  minutes: number;
} {
  const p = helsinkiParts(now);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

/** ISO +03:00-style Helsinki timestamp, `minutes` later than `iso`. */
export function addMinutesIso(iso: string, minutes: number): string {
  const date = new Date(new Date(iso).getTime() + minutes * 60_000);
  const p = helsinkiParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+03:00`;
}

export function minutesBetween(startIso: string, endIso: string): number {
  return (
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000
  );
}

/**
 * Grid row (0-based) for an ISO time, clamped into the day window.
 * Times outside 10:00–23:00 pin to the first/last slot rather than
 * producing out-of-range grid rows.
 */
export function slotIndexFor(iso: string): number {
  const idx = Math.floor((helsinkiMinutes(iso) - DAY_START_MIN) / SLOT_MIN);
  return Math.min(SLOT_COUNT - 1, Math.max(0, idx));
}

/**
 * Row span for a block. `Math.max(1, …)` is the render-site guard against
 * the negative-duration landmine: even if a bad duration slips past the
 * normalizer, CSS never receives a negative span.
 */
export function spanSlotsFor(startIso: string, endIso: string): number {
  const span = Math.ceil(minutesBetween(startIso, endIso) / SLOT_MIN);
  return Math.max(1, span);
}
