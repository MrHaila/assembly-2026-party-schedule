import { useMemo, type ReactNode } from "react";
import { useFavourites } from "@/hooks/use-favourites";
import { useLanguage } from "@/hooks/use-language";
import {
  computeDayWindow,
  dayMinutes,
  formatDayMinutes,
  formatTime,
} from "@/lib/schedule/time";
import type { Day, EventItem, Venue } from "@/lib/schedule/types";

interface ScheduleLogProps {
  day: Day;
  /** This day's events, all kinds. */
  events: readonly EventItem[];
  venueById: ReadonlyMap<string, Venue>;
  /** Schedule-time now: date is the schedule day, minutes are day minutes. */
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
  const { t } = useLanguage();
  const { isFavourite } = useFavourites();
  const entries = events.filter((e) => e.kind !== "ongoing");
  const win = useMemo(() => computeDayWindow(events), [events]);
  const showNow =
    !!now &&
    now.date === day.date &&
    now.minutes >= win.startMin &&
    now.minutes <= win.endMin;

  const rows: ReactNode[] = [];
  let nowInserted = false;
  const nowMarker =
    showNow && now ? <NowMarker minutes={now.minutes} label={t.now} /> : null;

  entries.forEach((event, i) => {
    if (nowMarker && !nowInserted && dayMinutes(event.start) > now!.minutes) {

      rows.push(<li key="now-marker" aria-hidden>{nowMarker}</li>);
      nowInserted = true;
    }
    const prev = entries[i - 1];
    const hourChanged =
      !prev || prev.start.slice(11, 13) !== event.start.slice(11, 13);
    const favourite = isFavourite(event.id);
    rows.push(
      <li
        key={event.id}
        className={hourChanged && i > 0 ? "mt-1 border-t border-ink/60" : ""}
      >
        <button
          type="button"
          onClick={() => onOpen(event)}
          className={`press flex min-h-[44px] w-full items-baseline gap-2.5 px-1 py-1.5 text-left${favourite ? " border-l-2 border-gold bg-event-favourite pl-1.5" : ""}`}
        >
          <span className="tnum w-11 shrink-0 text-[13px] font-bold">
            {formatTime(event.start)}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mid">
              {venueById.get(event.venueId)?.short ?? event.venueId}
              {event.estimated ? ` · ≈ ${t.estimated}` : ""}
              {event.streamUrls.length > 0 ? " ●" : ""}
            </span>
            <span className="block text-[15px] font-semibold leading-[1.3]">
              {favourite && <span className="mr-1 text-gold">★</span>}
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

function NowMarker({ minutes, label: nowLabel }: { minutes: number; label: string }) {
  const label = formatDayMinutes(minutes);

  return (
    <div id="now-marker" data-now-marker className="flex items-center gap-2 py-1">
      <span className="h-0.5 flex-1 bg-spot" />
      <span className="tnum text-[11px] font-bold uppercase tracking-[0.06em] text-spot">
        {nowLabel} · {label}
      </span>
      <span className="h-0.5 flex-1 bg-spot" />
    </div>
  );
}
