import * as Dialog from "@radix-ui/react-dialog";
import { useFavourites } from "@/hooks/use-favourites";
import { useLanguage } from "@/hooks/use-language";
import { pickLocalized } from "@/lib/i18n/language";
import { formatTimeRange } from "@/lib/schedule/time";
import type { EventItem, Venue } from "@/lib/schedule/types";
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
        </Dialog.Title>
        <ActionButton tone="outline" onClick={onClose} label={t.close}>
          <span aria-hidden>✕</span>
        </ActionButton>

      </div>

      <dl className="mt-3 space-y-1 text-[13px]">
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">{t.time}</dt>
          <dd className="tnum">
            {event.kind === "moment"
              ? `◆ ${formatTimeRange(event.start, event.end, false).split("–")[0]} ${t.sharp}`
              : formatTimeRange(event.start, event.end, event.estimated)}
            {event.estimated && (
              <span className="ml-1 text-ink-mid">
                {t.noEndTime}
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

      {(event.streamUrls.length > 0 || event.sourceUrl) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {event.streamUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="border border-ink bg-ink px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em] text-paper transition-colors duration-100 hover:border-spot hover:bg-spot active:border-ink-mid active:bg-ink-mid"
            >
              ● {t.watch} · {hostOf(url)}
            </a>
          ))}
          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="press border border-ink px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em]"
            >
              {t.officialPage} ↗
            </a>
          )}
        </div>
      )}
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
