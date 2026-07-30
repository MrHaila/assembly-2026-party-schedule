import { formatTime } from "@/lib/schedule/time";
import type { EventItem, Venue } from "@/lib/schedule/types";

interface OtherVenuesProps {
  /** Other-tier venues, in editorial order. */
  venues: readonly Venue[];
  /** This day's events, all kinds. */
  events: readonly EventItem[];
  onOpen: (event: EventItem) => void;
}

/**
 * The 8 minor venues as dense run-on paragraphs below the grid — exactly
 * what newspaper TV pages did with minor channels.
 */
export function OtherVenues({ venues, events, onOpen }: OtherVenuesProps) {
  const byVenue = new Map<string, EventItem[]>();
  for (const event of events) {
    if (event.kind === "ongoing") continue; // already in the band above
    const list = byVenue.get(event.venueId) ?? [];
    list.push(event);
    byVenue.set(event.venueId, list);
  }
  const visible = venues.filter((v) => (byVenue.get(v.slug) ?? []).length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="border-t-2 border-ink bg-paper px-2 py-2">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.06em]">
        Other venues
      </h2>
      <div className="mt-1 space-y-1">
        {visible.map((venue) => (
          <p key={venue.slug} className="text-[12px] leading-relaxed">
            <span className="font-bold uppercase tracking-[0.04em]">
              {venue.short}
            </span>
            <span className="text-ink-mid"> · </span>
            {(byVenue.get(venue.slug) ?? []).map((event, i) => (
              <span key={event.id}>
                {i > 0 && " · "}
                <button
                  type="button"
                  onClick={() => onOpen(event)}
                  className="underline decoration-transparent underline-offset-2 hover:decoration-ink"
                >
                  <span className="tnum font-semibold">
                    {formatTime(event.start)}
                  </span>{" "}
                  {event.kind === "moment" ? `◆ ${event.title}` : event.title}
                </button>
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
