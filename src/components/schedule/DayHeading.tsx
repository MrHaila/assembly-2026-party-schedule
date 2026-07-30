import { formatTimeRange } from "@/lib/schedule/time";
import type { Day, EventItem } from "@/lib/schedule/types";

interface DayHeadingProps {
  day: Day;
  /** The ≥6h items for this day — inlined here, never as grid blocks. */
  ongoing: readonly EventItem[];
  onOpen: (event: EventItem) => void;
}

/**
 * Sticky inline day separator inside the continuous timeline. The all-day
 * run-on line lives on the same band, so "what runs all day" is part of the
 * timeline rather than a floating strip above it.
 *
 * The band is deliberately ONE line of fixed height (--day-head-h): the
 * location header row parks directly beneath it, and a variable-height
 * heading would desync that offset. Overlong all-day runs scroll sideways
 * inside the band instead of wrapping.
 */
export function DayHeading({ day, ongoing, onOpen }: DayHeadingProps) {
  return (
    <div
      className="sticky top-0 z-40 flex h-[var(--day-head-h)] items-center gap-x-2 overflow-x-auto overflow-y-hidden whitespace-nowrap border-y-2 border-ink bg-ink px-2 text-paper"
      style={{ scrollbarWidth: "none" }}
    >
      <h2 className="shrink-0 text-[13px] font-bold uppercase tracking-[0.1em]">
        {day.label}
      </h2>
      {ongoing.length > 0 && (
        <p className="text-[12px] leading-none">
          <span className="font-bold uppercase tracking-[0.06em]">
            All day ▸{" "}
          </span>
          {ongoing.map((event, i) => (
            <span key={event.id}>
              {i > 0 && " · "}
              <button
                type="button"
                onClick={() => onOpen(event)}
                className="press-invert rounded-none px-0.5 py-0.5 font-medium underline decoration-paper/50 underline-offset-2 hover:decoration-paper"
              >
                {event.title}{" "}
                <span className="tnum opacity-70">
                  {formatTimeRange(event.start, event.end, event.estimated)}
                </span>
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
