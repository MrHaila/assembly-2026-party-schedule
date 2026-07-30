import type { CSSProperties } from "react";
import { formatTimeRange, slotIndexFor, spanSlotsFor } from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";

interface EventBlockProps {
  event: EventItem;
  /** 0-based index into the grid-eligible location list. */
  venueColumn: number;
  /** Sub-column lane from assignSubColumns (0 when alone). */
  lane: number;
  lanes: number;
  onOpen: (event: EventItem) => void;
}

/**
 * One proportional block in the grid. Placement is computed here and only
 * here — grid-row span is guarded by spanSlotsFor's Math.max(1, …), so no
 * data bug can ever produce a negative span. `data-col` lets CSS drop the
 * block when its location column does not fit the viewport.
 */
export function EventBlock({
  event,
  venueColumn,
  lane,
  lanes,
  onOpen,
}: EventBlockProps) {
  const style: CSSProperties = {
    // +2: CSS grid is 1-based, and column 1 is the time gutter.
    gridColumn: venueColumn + 2,
    gridRow: `${slotIndexFor(event.start) + 1} / span ${spanSlotsFor(event.start, event.end)}`,
    ...(lanes > 1 && {
      width: `${100 / lanes}%`,
      marginInlineStart: `${(lane * 100) / lanes}%`,
    }),
  };
  return (
    <button
      type="button"
      data-col={venueColumn + 1}
      onClick={() => onOpen(event)}
      style={style}
      className="z-10 flex flex-col items-stretch justify-start overflow-hidden border-t border-ink/60 bg-event px-1 pt-px text-left transition-colors duration-100 hover:bg-event-hover active:bg-event-active focus-visible:outline-2 focus-visible:outline-spot"
    >
      <span className="tnum block text-[10.5px] font-medium uppercase leading-[1.2] tracking-[0.02em] text-ink-mid">
        {formatTimeRange(event.start, event.end, event.estimated)}
        {event.streamUrls.length > 0 ? " ●" : ""}
        {event.venueIdSecondary ? " ⇄" : ""}
      </span>
      <span className="block text-[13px] font-semibold leading-[1.25] text-ink">
        {event.title}
      </span>
    </button>
  );
}
