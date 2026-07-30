import type { ReactNode } from "react";
import {
  DAY_END_MIN,
  DAY_START_MIN,
  formatTime,
  helsinkiMinutes,
} from "@/lib/schedule/time";
import type { Day, EventItem, Venue } from "@/lib/schedule/types";

interface ScheduleLogProps {
  day: Day;
  /** This day's events, all kinds. */
  events: readonly EventItem[];
  venueById: ReadonlyMap<string, Venue>;
  now: { date: string; minutes: number } | null;
  onOpen: (event: EventItem) => void;
}

/**
 * The mobile projection: same data as the grid, time-ordered, location as bold
 * prefix, hour separators. Print made this same choice for narrow columns.
 */
export function ScheduleLog({
  day,
  events,
  venueById,
  now,
  onOpen,
}: ScheduleLogProps) {
  const entries = events.filter((e) => e.kind !== "ongoing");
  const showNow =
    !!now &&
    now.date === day.date &&
    now.minutes >= DAY_START_MIN &&
    now.minutes <= DAY_END_MIN;

  const rows: ReactNode[] = [];
  let nowInserted = false;
  const nowMarker = showNow && now ? <NowMarker minutes={now.minutes} /> : null;

  entries.forEach((event, i) => {
    if (nowMarker && !nowInserted && helsinkiMinutes(event.start) > now!.minutes) {
      rows.push(<li key="now-marker" aria-hidden>{nowMarker}</li>);
      nowInserted = true;
    }
    const prev = entries[i - 1];
    const hourChanged =
      !prev || prev.start.slice(11, 13) !== event.start.slice(11, 13);
    rows.push(
      <li
        key={event.id}
        className={hourChanged && i > 0 ? "mt-1 border-t border-ink/60" : ""}
      >
        <button
          type="button"
          onClick={() => onOpen(event)}
          className="press flex min-h-[44px] w-full items-baseline gap-2.5 px-1 py-1.5 text-left"
        >
          <span className="tnum w-11 shrink-0 text-[13px] font-bold">
            {formatTime(event.start)}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mid">
              {venueById.get(event.venueId)?.short ?? event.venueId}
              {event.estimated ? " · ≈ estimated" : ""}
              {event.streamUrls.length > 0 ? " ●" : ""}
            </span>
            <span className="block text-[15px] font-semibold leading-[1.3]">
              {event.kind === "moment" ? `◆ ${event.title}` : event.title}
            </span>
          </span>
        </button>
      </li>,
    );
  });
  if (nowMarker && !nowInserted) {
    rows.push(<li key="now-marker" aria-hidden>{nowMarker}</li>);
  }

  return (
    <ul className="px-3 pb-6">
      {rows}
    </ul>
  );
}

function NowMarker({ minutes }: { minutes: number }) {
  const label = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
  return (
    <div id="now-marker" className="flex items-center gap-2 py-1">
      <span className="h-0.5 flex-1 bg-spot" />
      <span className="tnum text-[11px] font-bold uppercase tracking-[0.06em] text-spot">
        Now · {label}
      </span>
      <span className="h-0.5 flex-1 bg-spot" />
    </div>
  );
}
