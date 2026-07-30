import { formatTimeRange } from "@/lib/schedule/time";
import type { Day, EventItem } from "@/lib/schedule/types";

interface DayHeadingProps {
  day: Day;
  /** The ≥6h items for this day — inlined here, never as grid blocks. */
  ongoing: readonly EventItem[];
  onOpen: (event: EventItem) => void;
}

/**
 * Inline day separator inside the continuous timeline. The all-day run-on
 * line lives on the same band, so "what runs all day" is part of the
 * timeline rather than a floating strip above it.
 */
export function DayHeading({ day, ongoing, onOpen }: DayHeadingProps) {
  return (
    <div className="border-y-2 border-ink bg-ink px-2 py-1 text-paper">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px] leading-relaxed">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">
          {day.label}
        </h2>
        {ongoing.length > 0 && (
          <p className="min-w-0">
            <span className="font-bold uppercase tracking-[0.06em]">
              All day ▸{" "}
            </span>
            {ongoing.map((event, i) => (
              <span key={event.id}>
                {i > 0 && " · "}
                <button
                  type="button"
                  onClick={() => onOpen(event)}
                  className="font-medium underline decoration-paper/50 underline-offset-2 hover:decoration-paper"
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
    </div>
  );
}
