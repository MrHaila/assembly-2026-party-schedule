/**
 * Where the red "now" indicator belongs, globally.
 *
 * The marker must never disappear: if the clock is not inside any day's own
 * time window, it parks at the top of the next day that has not started yet,
 * or at the very bottom once the last day is over.
 */
import type { DayWindow } from "./time";
import type { Day } from "./types";

export type NowPlacement =
  | { kind: "inside"; dayId: string }
  | { kind: "before"; dayId: string }
  | { kind: "after"; dayId: string };

export interface ScheduleNow {
  /** Schedule day (05:00 rollover applied). */
  date: string;
  /** Day minutes (may exceed 1440 for post-midnight times). */
  minutes: number;
}

/**
 * @param days Schedule days, ascending by date.
 * @param windows Day window per day date.
 * @param now Schedule-time now, or null before hydration.
 */
export function resolveNowPlacement(
  days: readonly Day[],
  windows: ReadonlyMap<string, DayWindow>,
  now: ScheduleNow | null,
): NowPlacement | null {
  if (!now || days.length === 0) return null;

  for (const day of days) {
    const win = windows.get(day.date);
    if (!win) continue;
    if (day.date === now.date) {
      if (now.minutes < win.startMin) return { kind: "before", dayId: day.id };
      if (now.minutes <= win.endMin) return { kind: "inside", dayId: day.id };
      continue; // this day is over — fall through to the next one
    }
    if (day.date > now.date) return { kind: "before", dayId: day.id };
  }

  return { kind: "after", dayId: days[days.length - 1].id };
}
