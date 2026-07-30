import type { CSSProperties } from "react";
import {
  formatTimeRange,
  slotIndexFor,
  spanSlotsFor,
  type DayWindow,
} from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";
import { FavouriteStar } from "./FavouriteStar";

interface EventBlockProps {
  event: EventItem;
  /** 0-based index into the grid-eligible location list. */
  venueColumn: number;
  /** Sub-column lane from assignSubColumns (0 when alone). */
  lane: number;
  lanes: number;
  /** The day's visible time window — drives row placement. */
  window: DayWindow;
  /** True while the event is running right now — animates the stripe field. */
  live: boolean;
  /** Already finished — muted so upcoming events read first. */
  past: boolean;

  /** Starred by the visitor — gold outline, star always visible. */
  favourite: boolean;
  onToggleFavourite: (event: EventItem) => void;
  onOpen: (event: EventItem) => void;
}

/**
 * One proportional block in the grid. Placement is computed here and only
 * here — grid-row span is guarded by spanSlotsFor's Math.max(1, …), so no
 * data bug can ever produce a negative span. `data-col` lets CSS drop the
 * block when its location column does not fit the viewport.
 *
 * The wrapper is a plain element, not a button: the favourite star is itself
 * a button and buttons cannot nest.
 */
export function EventBlock({
  event,
  venueColumn,
  lane,
  lanes,
  window: win,
  live,
  past,
  favourite,
  onToggleFavourite,
  onOpen,
}: EventBlockProps) {
  const style: CSSProperties = {
    // +2: CSS grid is 1-based, and column 1 is the time gutter.
    gridColumn: venueColumn + 2,
    gridRow: `${slotIndexFor(event.start, win) + 1} / span ${spanSlotsFor(event.start, event.end)}`,
    ...(lanes > 1 && {
      width: `${100 / lanes}%`,
      marginInlineStart: `${(lane * 100) / lanes}%`,
    }),
  };

  return (
    <div
      data-col={venueColumn + 1}
      data-live={live ? "" : undefined}
      data-past={past ? "" : undefined}
      style={style}
      className={`group relative z-10 overflow-hidden border border-ink/45 bg-event transition-colors duration-100 hover:bg-event-hover active:bg-event-active${live ? " live-stripes" : ""}${favourite ? " event-favourite" : ""}${past ? " opacity-45 saturate-50 hover:opacity-100" : ""}`}
    >

      <button
        type="button"
        onClick={() => onOpen(event)}
        className="block h-full w-full px-1 pt-px text-left focus-visible:outline-2 focus-visible:outline-spot"
      >
        {/* Absolutely positioned so the label always hugs the start time —
            buttons vertically centre their content in every engine. */}
        <span className="absolute inset-x-1 top-px block">
          <span className="tnum block text-[10.5px] font-medium uppercase leading-[1.2] tracking-[0.02em] text-ink-mid">
            {formatTimeRange(event.start, event.end, event.estimated)}
            {event.streamUrls.length > 0 ? " ●" : ""}
            {event.venueIdSecondary ? " ⇄" : ""}
          </span>
          <span className="block pr-4 text-[13px] font-semibold leading-[1.25] text-ink">
            {event.title}
          </span>
        </span>
      </button>

      {/* Muted until hover/focus, permanent once starred. */}
      <span
        className={`pointer-events-none absolute right-0 top-0 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100${favourite ? " !opacity-100" : ""}`}
      >
        <span className="pointer-events-auto block">
          <FavouriteStar
            favourite={favourite}
            onToggle={() => onToggleFavourite(event)}
            size="grid"
          />
        </span>
      </span>

      {/* Oversized muted star mark for favourited events: sits behind the
          text as a background texture, clipped so it never spills. */}
      {favourite && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-25%] right-[-6%] z-0 w-[55%] rotate-[22deg] text-gold/[0.25]"
        >
          <svg viewBox="0 0 24 24" className="h-auto w-full fill-current">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
      )}
    </div>
  );
}
