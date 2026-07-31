import { useMemo } from "react";
import { useFavourites } from "@/hooks/use-favourites";
import { assignSubColumns } from "@/lib/schedule/normalize";
import {
  computeDayWindow,
  dayMinutes,
  formatDayMinutes,
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
  /** Schedule-time now: date is the schedule day, minutes are day minutes. */
  now: { date: string; minutes: number } | null;
  /** The page decides which day owns the single now-marker. */
  showNowMarker: boolean;
  onOpen: (event: EventItem) => void;
}

/**
 * The desktop projection for one day: location columns on a proportional
 * time axis, sticky gutter + headers, hour rules, moment markers, now bar.
 * The visible column count is pure CSS (see .schedule-cols in styles.css).
 * The vertical extent is data-driven: earliest start → latest end of the day,
 * snapped to whole hours, with the day rolling over at 05:00.
 */
export function ScheduleGrid({
  day,
  venues,
  events,
  now,
  showNowMarker,
  onOpen,
}: ScheduleGridProps) {
  const { isFavourite, toggle } = useFavourites();
  const gridSlugs = new Set(venues.map((v) => v.slug));
  const moments = events.filter(
    (e) => e.kind === "moment" && gridSlugs.has(e.venueId),
  );
  const sessions = events.filter((e) => e.kind === "session");

  const win = useMemo(() => computeDayWindow(events), [events]);
  const length = win.endMin - win.startMin;

  const showNow =
    showNowMarker &&
    !!now &&
    now.date === day.date &&
    now.minutes >= win.startMin &&
    now.minutes <= win.endMin;

  return (
    <div>
      {/* Sticky location headers — shares .schedule-cols with the body so the
          two grids stay column-aligned. They park under the sticky day
          heading (--day-head-h), never on top of it. */}
      <div className="schedule-cols sticky top-[var(--day-head-h)] z-30 grid border-b-2 border-ink bg-paper">
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

      <div
        className="schedule-grid relative border-b border-rule"
        style={{ ["--slots" as string]: win.slotCount }}
      >
        {/* Sticky time gutter spanning every row. It draws its own hour
            ticks, so the hairline still reads across to the page edge even
            though the rules over the columns sit BEHIND the event blocks. */}
        <div
          className="sticky left-0 z-20 border-r border-rule bg-paper"
          style={{ gridColumn: 1, gridRow: "1 / -1" }}
        >
          {win.hours.map((h) => (
            <div key={h}>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 border-t border-rule"
                style={{ top: `${((h - win.startMin) / length) * 100}%` }}
              />
              <span
                className="tnum absolute right-1 text-[11px] font-semibold leading-none tracking-[0.04em] text-ink-mid"
                style={{
                  top: `calc(${((h - win.startMin) / length) * 100}% + 3px)`,
                }}
              >
                {formatDayMinutes(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Hour rules over the location columns — heavier rule at the hour,
            none between (M1). z-0 puts them UNDER the event blocks, whose
            translucent surface mutes the line like frosted glass. */}
        {win.hours.map((h) => (
          <div
            key={h}
            aria-hidden
            className="pointer-events-none z-0 self-start border-t border-rule"
            style={{
              gridColumn: "2 / -1",
              gridRow: (h - win.startMin) / 5 + 1,
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
                window={win}
                favourite={isFavourite(event.id)}
                onToggleFavourite={(e) => toggle(e.id)}
                past={
                  !!now &&
                  (day.date < now.date ||
                    (day.date === now.date &&
                      dayMinutes(event.end) <= now.minutes))
                }
                live={
                  showNow &&
                  !!now &&
                  dayMinutes(event.start) <= now.minutes &&
                  dayMinutes(event.end) > now.minutes
                }

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
              gridRow: slotIndexFor(moment.start, win) + 1,
            }}
          >
            <span className="press relative -top-[7px] ml-12 inline-block border border-ink/50 bg-paper px-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
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
            data-now-marker
            className="relative z-[25] self-start"
            style={{
              gridColumn: "1 / -1",
              gridRow: Math.floor((now.minutes - win.startMin) / 5) + 1,
            }}
          >
            <div className="absolute inset-x-0 top-0 border-t-2 border-spot" />
            <span className="tnum absolute left-0 top-[-7px] bg-spot px-1 text-[10px] font-bold leading-[14px] text-paper">
              {formatDayMinutes(now.minutes)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
