import { formatTimeRange } from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";

interface OngoingBandProps {
  events: readonly EventItem[];
  onOpen: (event: EventItem) => void;
}

/** The ≥6h items as one run-on line above the grid — never as grid blocks. */
export function OngoingBand({ events, onOpen }: OngoingBandProps) {
  if (events.length === 0) return null;
  return (
    <div className="border-b border-ink bg-paper px-2 py-1 text-[12px] leading-relaxed">
      <span className="font-bold uppercase tracking-[0.06em]">All day ▸ </span>
      {events.map((event, i) => (
        <span key={event.id}>
          {i > 0 && " · "}
          <button
            type="button"
            onClick={() => onOpen(event)}
            className="font-medium underline decoration-rule underline-offset-2 hover:decoration-ink"
          >
            {event.title}{" "}
            <span className="tnum text-ink-mid">
              {formatTimeRange(event.start, event.end, event.estimated)}
            </span>
          </button>
        </span>
      ))}
    </div>
  );
}
