import { describe, expect, it } from "vitest";
import { resolveNowPlacement } from "@/lib/schedule/now-placement";
import type { DayWindow } from "@/lib/schedule/time";
import type { Day } from "@/lib/schedule/types";

const days = [
  { id: "d1", date: "2026-07-30" },
  { id: "d2", date: "2026-07-31" },
] as unknown as Day[];

const win = (startMin: number, endMin: number): DayWindow => ({
  startMin,
  endMin,
  slotCount: (endMin - startMin) / 5,
  hours: [],
});

const windows = new Map([
  ["2026-07-30", win(600, 1380)],
  ["2026-07-31", win(600, 1380)],
]);

describe("resolveNowPlacement", () => {
  it("returns null without a clock", () => {
    expect(resolveNowPlacement(days, windows, null)).toBeNull();
  });

  it("places inside a day window", () => {
    expect(
      resolveNowPlacement(days, windows, { date: "2026-07-30", minutes: 700 }),
    ).toEqual({ kind: "inside", dayId: "d1" });
  });

  it("places before a day that has not started", () => {
    expect(
      resolveNowPlacement(days, windows, { date: "2026-07-30", minutes: 480 }),
    ).toEqual({ kind: "before", dayId: "d1" });
  });

  it("rolls a finished day forward to the next one", () => {
    expect(
      resolveNowPlacement(days, windows, { date: "2026-07-30", minutes: 1400 }),
    ).toEqual({ kind: "before", dayId: "d2" });
  });

  it("places before the weekend", () => {
    expect(
      resolveNowPlacement(days, windows, { date: "2026-07-01", minutes: 700 }),
    ).toEqual({ kind: "before", dayId: "d1" });
  });

  it("places after the last day", () => {
    expect(
      resolveNowPlacement(days, windows, { date: "2026-08-05", minutes: 700 }),
    ).toEqual({ kind: "after", dayId: "d2" });
    expect(
      resolveNowPlacement(days, windows, { date: "2026-07-31", minutes: 1400 }),
    ).toEqual({ kind: "after", dayId: "d2" });
  });
});
