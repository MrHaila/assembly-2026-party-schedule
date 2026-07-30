import { useFavourites } from "@/hooks/use-favourites";
import { useLanguage } from "@/hooks/use-language";
import { formatTime } from "@/lib/schedule/time";
import type { EventItem, Venue } from "@/lib/schedule/types";

interface OtherLocationsProps {
  /** Locations that never get a column, busiest first. */
  venues: readonly Venue[];
  /**
   * Grid-eligible locations, in column order. Each is rendered here too and
   * hidden by CSS whenever its column fits — the responsive overflow.
   */
  gridVenues: readonly Venue[];
  /** This day's events, all kinds. */
  events: readonly EventItem[];
  onOpen: (event: EventItem) => void;
}

/**
 * Minor locations as dense run-on paragraphs below the grid — exactly what
 * newspaper TV pages did with minor channels. Grid locations appear here as
 * well, marked with `data-overflow-col`, so a narrow viewport degrades to
 * the list form with no JS measurement.
 */
export function OtherVenues({
  venues,
  gridVenues,
  events,
  onOpen,
}: OtherLocationsProps) {
  const { t } = useLanguage();
  const { isFavourite } = useFavourites();
  const byVenue = new Map<string, EventItem[]>();
  for (const event of events) {
    if (event.kind === "ongoing") continue; // already on the day heading
    const list = byVenue.get(event.venueId) ?? [];
    list.push(event);
    byVenue.set(event.venueId, list);
  }

  const rows = [
    ...gridVenues.map((venue, i) => ({ venue, overflowCol: i + 1 })),
    ...venues.map((venue) => ({ venue, overflowCol: undefined })),
  ].filter(({ venue }) => (byVenue.get(venue.slug) ?? []).length > 0);
  if (rows.length === 0) return null;

  return (
    <section className="border-t-2 border-ink bg-paper px-3 py-2">
      <h3 className="text-[12px] font-bold uppercase tracking-[0.06em]">
        {t.otherLocations}
      </h3>
      <div className="mt-1 space-y-1">
        {rows.map(({ venue, overflowCol }) => (
          <p
            key={venue.slug}
            data-overflow-col={overflowCol}
            className="text-[12px] leading-relaxed"
          >
            <span className="font-bold uppercase tracking-[0.04em]">
              {venue.short}
            </span>
            <span className="text-ink-mid"> · </span>
            {(byVenue.get(venue.slug) ?? []).map((event, i) => {
              const favourite = isFavourite(event.id);
              return (
                <span key={event.id}>
                  {i > 0 && " · "}
                  <button
                    type="button"
                    onClick={() => onOpen(event)}
                    className={`press px-0.5 underline decoration-transparent underline-offset-2 hover:decoration-ink${favourite ? " bg-event-favourite" : ""}`}
                  >
                    {favourite && (
                      <span aria-hidden className="text-gold">
                        ★{" "}
                      </span>
                    )}
                    <span className="tnum font-semibold">
                      {formatTime(event.start)}
                    </span>{" "}
                    {event.kind === "moment" ? `◆ ${event.title}` : event.title}
                  </button>
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </section>
  );
}
