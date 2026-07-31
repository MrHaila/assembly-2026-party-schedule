import { useLanguage } from "@/hooks/use-language";
import { dayLabel } from "@/lib/i18n/strings";
import { formatTimeRange } from "@/lib/schedule/time";
import type { Day, EventItem } from "@/lib/schedule/types";

interface DayHeadingProps {
  day: Day;
  /** The ≥6h items for this day — inlined here, never as grid blocks. */
  ongoing: readonly EventItem[];
  onOpen: (event: EventItem) => void;
}

/**
 * Inline day separator inside the continuous timeline.
 *
 * Two bands, on purpose:
 *  - the day name is its own STICKY row of fixed height (--day-head-h), so
 *    the location header row can park at exactly that offset;
 *  - the all-day run-on sits directly below it, not sticky, so it may wrap
 *    to as many lines as it needs instead of hiding rows in a side scroller.
 */
export function DayHeading({ day, ongoing, onOpen }: DayHeadingProps) {
  const { language, t } = useLanguage();
  return (
    <>
      <div className="sticky top-0 z-40 flex h-[var(--day-head-h)] items-center border-y-2 border-strong bg-band px-3 text-ink">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">
          {dayLabel(day, language)}
        </h2>
      </div>
      {ongoing.length > 0 && (
        <p className="border-b-2 border-strong bg-band px-3 pb-1 text-[12px] leading-[1.5] text-ink">
          <span className="font-bold uppercase tracking-[0.06em]">
            {t.allDay} ▸{" "}
          </span>
          {ongoing.map((event, i) => (
            <span key={event.id}>
              {i > 0 && " · "}
              <button
                type="button"
                onClick={() => onOpen(event)}
                className="press rounded-none px-0.5 py-0.5 font-medium underline decoration-ink-mid underline-offset-2 hover:decoration-ink"

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
    </>
  );
}
