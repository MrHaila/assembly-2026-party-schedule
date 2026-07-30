import * as Dialog from "@radix-ui/react-dialog";
import { useFavourites } from "@/hooks/use-favourites";
import { useLanguage } from "@/hooks/use-language";
import { useNow } from "@/hooks/use-now";
import { pickLocalized } from "@/lib/i18n/language";
import { formatCountdown, isoDayLabel } from "@/lib/i18n/strings";
import { formatTimeRange } from "@/lib/schedule/time";
import type { EventItem, Venue } from "@/lib/schedule/types";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { FavouriteStar } from "./FavouriteStar";



interface DetailSheetProps {
  event: EventItem | null;
  venueById: ReadonlyMap<string, Venue>;
  onClose: () => void;
}

/**
 * Event detail. Bottom sheet on mobile, centered panel on desktop.
 * Not a route — the grid behind it is the context.
 */
export function DetailSheet({ event, venueById, onClose }: DetailSheetProps) {
  return (
    <Dialog.Root
      open={!!event}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] overflow-y-auto border-t-2 border-ink bg-paper p-4 pb-8 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(480px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border-2"
        >
          {event && (
            <SheetBody event={event} venueById={venueById} onClose={onClose} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SheetBody({
  event,
  venueById,
  onClose,
}: {
  event: EventItem;
  venueById: ReadonlyMap<string, Venue>;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();
  const { isFavourite, toggle } = useFavourites();
  const excerpt = pickLocalized(language, {
    fi: event.excerptFi,
    en: event.excerptEn,
  });
  const venue = venueById.get(event.venueId);
  const secondary = event.venueIdSecondary
    ? venueById.get(event.venueIdSecondary)
    : undefined;

  // Relative time is client-only (useNow returns null on the server), so the
  // countdown / past badge simply appear after hydration.
  const now = useNow(30_000);
  const minutesUntilStart = now
    ? (new Date(event.start).getTime() - now.getTime()) / 60_000
    : null;
  const isPast = now ? new Date(event.end).getTime() <= now.getTime() : false;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Dialog.Title className="text-[20px] font-bold leading-tight">
          {event.title}
          {event.fiOnly && (
            <span className="ml-2 border border-ink px-1 align-middle text-[10px] font-bold uppercase tracking-[0.06em]">
              FI
            </span>
          )}
          {isPast && (
            <span className="ml-2 border border-ink-mid/60 bg-ink/10 px-1 align-middle text-[10px] font-bold uppercase tracking-[0.06em] text-ink-mid">
              {t.pastEvent}
            </span>
          )}
        </Dialog.Title>

        <ActionButton tone="outline" onClick={onClose} label={t.close}>
          <span aria-hidden>✕</span>
        </ActionButton>

      </div>

      <dl className="mt-3 space-y-1 text-[13px]">
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">{t.time}</dt>
          <dd className="tnum">
            <span className="font-semibold uppercase tracking-[0.04em]">
              {isoDayLabel(event.start, language)}
            </span>{" "}
            {event.kind === "moment"
              ? `◆ ${formatTimeRange(event.start, event.end, false).split("–")[0]} ${t.sharp}`
              : formatTimeRange(event.start, event.end, event.estimated)}
            {event.estimated && (
              <span className="ml-1 text-ink-mid">
                {t.noEndTime}
              </span>
            )}
            {minutesUntilStart !== null && minutesUntilStart > 0 && (
              <span className="ml-1 text-ink-mid">
                ({formatCountdown(language, minutesUntilStart)})
              </span>
            )}
          </dd>
        </div>

        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">{t.location}</dt>
          <dd>
            {venue?.name ?? event.venueId}
            {secondary && <> ⇄ {secondary.name}</>}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">{t.type}</dt>
          <dd className="uppercase tracking-[0.04em]">
            {event.categories.join(" · ")}
          </dd>
        </div>
      </dl>

      {excerpt && (
        <p className="mt-3 border-t border-rule pt-3 text-[14px] leading-relaxed">
          {excerpt}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {event.streamUrls.map((url) => (
          <ActionLink key={url} tone="solid" href={url}>
            ● {t.watch} · {hostOf(url)}
          </ActionLink>
        ))}
        {event.sourceUrl && (
          <ActionLink tone="outline" href={event.sourceUrl}>
            {t.officialPage} ↗
          </ActionLink>
        )}
        <span className="ml-auto">
          <FavouriteStar
            favourite={isFavourite(event.id)}
            onToggle={() => toggle(event.id)}
            size="action"
          />
        </span>
      </div>

    </div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
