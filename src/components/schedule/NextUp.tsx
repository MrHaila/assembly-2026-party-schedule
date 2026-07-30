import { useLanguage } from "@/hooks/use-language";
import { formatCountdown } from "@/lib/i18n/strings";
import type { NextUpEntry } from "@/lib/schedule/favourites";
import { formatTime } from "@/lib/schedule/time";
import type { EventItem, Venue } from "@/lib/schedule/types";

interface NextUpProps {
  /** Already resolved and ordered by nextUpFavourites. */
  entries: readonly NextUpEntry[];
  venueById: ReadonlyMap<string, Venue>;
  /** header = one dense line in the desktop header, strip = mobile board. */
  variant: "header" | "strip";
  onOpen: (event: EventItem) => void;
}

/**
 * Departure-board for your starred events: what is next, in how long, where.
 * The mobile strip adds a one-line preview of the one after that.
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
            ? "hidden min-w-0 items-center gap-2 text-[11px] uppercase tracking-[0.05em] text-ink-mid lg:flex"
            : "border-b border-rule px-3 py-1.5 text-[11px] uppercase tracking-[0.05em] text-ink-mid"
        }
      >
        <span className="text-gold">★</span>
        <span className="truncate">{t.noFavourites}</span>
      </div>
    );
  }

  const countdown = first.live
    ? t.liveNow
    : formatCountdown(language, first.minutesUntil);

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={() => onOpen(first.event)}
        className="press hidden min-w-0 items-baseline gap-2 border border-gold px-2 py-0.5 text-left lg:flex"
      >
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mid">
          {t.nextUp}
        </span>
        <span className="text-gold">★</span>
        <span className="max-w-[24ch] truncate text-[13px] font-bold">
          {first.event.title}
        </span>
        <span className="tnum shrink-0 text-[12px] font-semibold uppercase tracking-[0.04em]">
          {countdown}
        </span>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.05em] text-ink-mid">
          {venueOf(first.event)}
        </span>
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
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mid">
            {t.nextUp}
          </span>
          <span className="tnum text-[13px] font-bold uppercase tracking-[0.04em] text-gold">
            {countdown}
          </span>
        </span>
        <span className="mt-0.5 flex items-baseline gap-2">
          <span className="text-gold">★</span>
          <span className="min-w-0 flex-1 truncate text-[16px] font-bold leading-tight">
            {first.event.title}
          </span>
        </span>
        <span className="mt-0.5 flex items-baseline gap-2 text-[11px] uppercase tracking-[0.05em] text-ink-mid">
          <span className="tnum">{formatTime(first.event.start)}</span>
          <span className="truncate">{venueOf(first.event)}</span>
        </span>
      </button>

      {second && (
        <button
          type="button"
          onClick={() => onOpen(second.event)}
          className="press flex w-full items-baseline gap-2 border-t border-rule px-3 py-1 text-left text-[11px]"
        >
          <span className="shrink-0 font-bold uppercase tracking-[0.06em] text-ink-mid">
            {t.thenAfter}
          </span>
          <span className="tnum shrink-0">{formatTime(second.event.start)}</span>
          <span className="min-w-0 flex-1 truncate font-semibold">
            {second.event.title}
          </span>
          <span className="shrink-0 uppercase tracking-[0.05em] text-ink-mid">
            {venueOf(second.event)}
          </span>
        </button>
      )}
    </div>
  );
}
