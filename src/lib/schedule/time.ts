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

/**
 * The schedule day rolls over at 05:00, not midnight: a Friday-night rave
 * running 01:00–04:00 belongs to Friday. Everything below works in
 * "day minutes" — minutes since the *schedule* day's 00:00, so 02:00 the
 * next morning is 1560, not 120.
 */
export const DAY_CUTOVER_MIN = 5 * 60;

/** Legacy fallback window, used only when a day has no events at all. */
export const DAY_START_MIN = 10 * 60;
export const DAY_END_MIN = 23 * 60;
export const DAY_LENGTH_MIN = DAY_END_MIN - DAY_START_MIN; // 780
export const SLOT_MIN = 5;
export const SLOT_COUNT = DAY_LENGTH_MIN / SLOT_MIN; // 156

/** The visible time window of one day, in day minutes. */
export interface DayWindow {
  startMin: number;
  endMin: number;
  /** Number of 5-minute rows in the grid. */
  slotCount: number;
  /** Hour marks to label, in day minutes (may exceed 24h). */
  hours: number[];
}

/** Minutes since Helsinki midnight for an ISO timestamp's local part. */
export function helsinkiMinutes(iso: string): number {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  return h * 60 + m;
}

/**
 * Minutes since the schedule day's midnight — times before 05:00 belong to
 * the previous schedule day and are expressed as 1440+.
 */
export function dayMinutes(iso: string): number {
  const m = helsinkiMinutes(iso);
  return m < DAY_CUTOVER_MIN ? m + 24 * 60 : m;
}

/** Same shift for a wall-clock {date, minutes} pair. */
export function toScheduleTime(now: { date: string; minutes: number }): {
  date: string;
  minutes: number;
} {
  if (now.minutes >= DAY_CUTOVER_MIN) return now;
  return { date: shiftDate(now.date, -1), minutes: now.minutes + 24 * 60 };
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD of an ISO timestamp's local part. */
export function isoDate(iso: string): string {
  return iso.slice(0, 10);
}

/** The schedule day an event belongs to (05:00 rollover). */
export function scheduleDate(iso: string): string {
  const date = isoDate(iso);
  return helsinkiMinutes(iso) < DAY_CUTOVER_MIN ? shiftDate(date, -1) : date;
}

/** "HH:mm" of an ISO timestamp's local part. */
export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

/** "HH:MM" for day minutes, wrapping past 24h back to 00–04. */
export function formatDayMinutes(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * The window one day actually occupies: earliest start → latest end of its
 * timed events, snapped out to whole hours. Days without timed events fall
 * back to the classic 10:00–23:00 frame.
 */
export function computeDayWindow(
  events: readonly { start: string; end: string; kind: string }[],
): DayWindow {
  const timed = events.filter((e) => e.kind !== "ongoing");
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;
  for (const e of timed) {
    const s = dayMinutes(e.start);
    const rawEnd = dayMinutes(e.end);
    // An end that wrapped below its own start (e.g. 23:30 → 00:30) is the
    // next calendar day: keep it monotonic.
    const eEnd = rawEnd >= s ? rawEnd : rawEnd + 24 * 60;
    if (s < start) start = s;
    if (eEnd > end) end = eEnd;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    start = DAY_START_MIN;
    end = DAY_END_MIN;
  }
  let startMin = Math.floor(start / 60) * 60;
  let endMin = Math.ceil(end / 60) * 60;
  if (endMin - startMin < 60) endMin = startMin + 60;
  const hours: number[] = [];
  for (let h = startMin; h <= endMin - 60; h += 60) hours.push(h);
  return {
    startMin,
    endMin,
    slotCount: (endMin - startMin) / SLOT_MIN,
    hours,
  };
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

/** Current Helsinki wall time as an ISO +03:00-style timestamp. */
export function nowHelsinkiIso(now: Date = new Date()): string {
  const p = helsinkiParts(now);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+03:00`;
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
