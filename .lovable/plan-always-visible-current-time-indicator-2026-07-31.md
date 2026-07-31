# Always-visible current time indicator

Today the red "now" rule only renders when the clock falls inside a day's own time window. Between days (e.g. early morning), before the weekend, or after it ends, the indicator disappears entirely and the viewer loses their anchor.

## Behaviour

Decide one single placement for the whole timeline, and always render exactly one marker:

1. **Now is inside a day's window** — unchanged: the red rule sits at its proportional position in that day's grid (or between list rows on mobile).
2. **Now is before a day starts** (including before the whole weekend, and the gap between two days) — the marker renders as a full-width red rule directly above that day's inline day header, reading "now HH:MM — day has not started yet".
3. **Now is after the last day ends** — the marker renders at the very bottom of the last day's content, below the "Muut sijainnit" / other-locations block, reading "now HH:MM — event has ended".

Only one marker exists on the page at a time, so the initial scroll-to-now landing keeps working with no change.

## Technical notes

- Add a pure helper (with tests) in `src/lib/schedule/` that takes the days, their computed windows, and schedule-time now, and returns a placement descriptor: `{ kind: "inside", dayId }`, `{ kind: "before", dayId }`, `{ kind: "after", dayId }`, or `null` when there is no clock yet (SSR).
- Compute the placement once in `src/routes/index.tsx` and pass it down; `ScheduleGrid` / `ScheduleLog` only draw the in-grid rule when the placement says `inside` for that day, instead of each deciding for itself.
- New small component `src/components/schedule/NowRail.tsx`: the standalone red rule + time chip + short caption, used for the `before` and `after` cases. It carries `data-now-marker` so the existing landing logic finds it; the in-grid bar keeps that attribute for the `inside` case.
- Captions go through the i18n strings module (FI/EN), no hardcoded copy.
- Day-window computation currently lives inside `ScheduleGrid`; lift it (memoised per day) into the page so both the placement helper and the grid share the same numbers.
- Document the rule in `docs/design/design-log.md`.
