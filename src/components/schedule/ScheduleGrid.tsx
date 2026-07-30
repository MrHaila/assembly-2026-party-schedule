import {
  DAY_END_MIN,
  DAY_LENGTH_MIN,
  DAY_START_MIN,
  formatTime,
  slotIndexFor,
} from "@/lib/schedule/time";
import type { Day, EventItem, Venue } from "@/lib/schedule/types";
import { EventBlock } from "./EventBlock";

interface ScheduleGridProps {
  day: Day;
  /** Grid-eligible locations, busiest first. CSS decides how many show. */
  venues: readonly Venue[];
  /** This day's events, all kinds. */
  events: readonly EventItem[];
  now: { date: string; minutes: number } | null;
  onOpen: (event: EventItem) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => 10 + i); // 10..22

/**
 * The desktop projection for one day: location columns on a proportional
 * time axis, sticky gutter + headers, hour rules, moment markers, now bar.
 * The visible column count is pure CSS (see .schedule-cols in styles.css).
 */
export function ScheduleGrid({
  day,
  venues,
  events,
  now,
  onOpen,
}: ScheduleGridProps) {
  const gridSlugs = new Set(venues.map((v) => v.slug));
  const moments = events.filter(
    (e) => e.kind === "moment" && gridSlugs.has(e.venueId),
  );
  const sessions = events.filter((e) => e.kind === "session");

  const showNow =
    !!now &&
    now.date === day.date &&
    now.minutes >= DAY_START_MIN &&
    now.minutes <= DAY_END_MIN;

  return (
    <div>
      {/* Sticky location headers — shares .schedule-cols with the body so the
          two grids stay column-aligned. */}
      <div className="schedule-cols sticky top-0 z-30 grid border-b-2 border-ink bg-paper">
        <div className="border-r border-rule" />
        {venues.map((venue, colIdx) => (
          <div
            key={venue.slug}
            data-col={colIdx + 1}
            className="truncate border-r border-rule px-1.5 py-1 text-[12px] font-bold uppercase tracking-[0.06em]"
          >
            {venue.short}
          </div>
        ))}
      </div>

      <div className="schedule-grid relative border-b border-rule">
        {/* Sticky time gutter spanning every row */}
        <div
          className="sticky left-0 z-20 border-r border-rule bg-paper"
          style={{ gridColumn: 1, gridRow: "1 / -1" }}
        >
          {HOURS.map((h) => (
            <span
              key={h}
              className="tnum absolute right-1 text-[11px] font-semibold leading-none tracking-[0.04em] text-ink-mid"
              style={{
                top: `calc(${((h * 60 - DAY_START_MIN) / DAY_LENGTH_MIN) * 100}% - 6px)`,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Hour rules — heavier rule at the hour, none between (M1) */}
        {HOURS.slice(1).map((h) => (
          <div
            key={h}
            aria-hidden
            className="pointer-events-none self-start border-t border-rule"
            style={{
              gridColumn: "2 / -1",
              gridRow: (h * 60 - DAY_START_MIN) / 5 + 1,
            }}
          />
        ))}

        {/* Event blocks, incl. the two-location event in both columns */}
        {venues.map((venue, colIdx) => {
          const colEvents = sessions.filter(
            (e) => e.venueId === venue.slug || e.venueIdSecondary === venue.slug,
          );
          const placements = new Map(
            assignSubColumns(colEvents).map((p) => [p.id, p]),
          );
          return colEvents.map((event) => {
            const p = placements.get(event.id)!;
            return (
              <EventBlock
                key={`${venue.slug}-${event.id}`}
                event={event}
                venueColumn={colIdx}
                lane={p.lane}
                lanes={p.lanes}
                onOpen={onOpen}
              />
            );
          });
        })}

        {/* Moment markers — labelled rules across all columns */}
        {moments.map((moment) => (
          <button
            key={moment.id}
            type="button"
            onClick={() => onOpen(moment)}
            className="z-20 self-start text-left"
            style={{
              gridColumn: "1 / -1",
              gridRow: slotIndexFor(moment.start) + 1,
            }}
          >
            <span className="relative -top-[7px] ml-12 inline-block border border-ink/50 bg-paper px-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] hover:bg-marker/70">
              ◆ <span className="tnum">{formatTime(moment.start)}</span>{" "}
              {moment.title}
            </span>
          </button>
        ))}

        {/* Now bar — the one animated thing in the product. The wrapper is
            positioned so the time chip rides the rule instead of pinning
            itself to the top of the grid. */}
        {showNow && now && (
          <div
            aria-hidden
            className="relative z-30 self-start"
            style={{
              gridColumn: "1 / -1",
              gridRow: Math.floor((now.minutes - DAY_START_MIN) / 5) + 1,
            }}
          >
            <div className="absolute inset-x-0 top-0 border-t-2 border-spot" />
            <span className="tnum absolute left-0 top-[-7px] bg-spot px-1 text-[10px] font-bold leading-[14px] text-paper">
              {Math.floor(now.minutes / 60)}:
              {String(now.minutes % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
