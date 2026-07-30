import { useLanguage } from "@/hooks/use-language";
import { formatCountdown } from "@/lib/i18n/strings";
import type { NextUpEntry } from "@/lib/schedule/favourites";
import type { EventItem, Venue } from "@/lib/schedule/types";

interface NextUpProps {
  /** Already resolved and ordered by nextUpFavourites. */
  entries: readonly NextUpEntry[];
  venueById: ReadonlyMap<string, Venue>;
  /** header = compact badge in the desktop header, strip = mobile board. */
  variant: "header" | "strip";
  onOpen: (event: EventItem) => void;
}

/**
 * Departure-board for your starred events: two lines — what is next, then
 * how long and where. A third muted line previews the one after that.
 */
export function NextUp({ entries, venueById, variant, onOpen }: NextUpProps) {
  const { t, language } = useLanguage();
  const [first, second] = entries;

  const venueOf = (event: EventItem) =>
    venueById.get(event.venueId)?.short ?? event.venueId;

  if (!first) {
    return (
      <div
        className={
          variant === "header"
            ? "hidden min-w-0 items-center text-[11px] uppercase tracking-[0.05em] text-ink-mid lg:flex"
            : "border-b border-rule px-3 py-1.5 text-[11px] uppercase tracking-[0.05em] text-ink-mid"
        }
      >
        <span className="truncate">{t.noFavourites}</span>
      </div>
    );
  }

  const lineTwo = (entry: NextUpEntry) =>
    `${entry.live ? t.liveNow : formatCountdown(language, entry.minutesUntil)} ${t.atLocation} ${venueOf(entry.event)}`;

  const thenLine = second
    ? `${t.thenAfter}: ${second.event.title} ${
        second.live
          ? t.liveNow
          : formatCountdown(language, second.minutesUntil)
      }`
    : null;

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={() => onOpen(first.event)}
        className="press hidden min-w-0 flex-col items-start border border-gold px-2 py-0.5 text-left lg:flex"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mid">
            {t.nextUp}
          </span>
          <span className="max-w-[28ch] truncate text-[13px] font-bold">
            {first.event.title}
          </span>
        </span>
        <span className="tnum truncate text-[11px] uppercase tracking-[0.04em] text-ink-mid">
          {lineTwo(first)}
        </span>
        {thenLine && (
          <span className="tnum max-w-[40ch] truncate text-[10px] uppercase tracking-[0.04em] text-ink-mid">
            {thenLine}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="border-b-2 border-ink bg-paper">
      <button
        type="button"
        onClick={() => onOpen(first.event)}
        className="press block w-full px-3 py-1.5 text-left"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mid">
            {t.nextUp}
          </span>
          <span className="min-w-0 flex-1 truncate text-[16px] font-bold leading-tight">
            {first.event.title}
          </span>
        </span>
        <span className="tnum mt-0.5 block truncate text-[12px] uppercase tracking-[0.04em]">
          {lineTwo(first)}
        </span>
      </button>

      {second && (
        <button
          type="button"
          onClick={() => onOpen(second.event)}
          className="press tnum block w-full truncate border-t border-rule px-3 py-1 text-left text-[10px] uppercase tracking-[0.05em] text-ink-mid"
        >
          {thenLine}
        </button>
      )}
    </div>
  );
}
