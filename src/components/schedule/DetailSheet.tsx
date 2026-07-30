import * as Dialog from "@radix-ui/react-dialog";
import { formatTimeRange } from "@/lib/schedule/time";
import type { EventItem, Venue } from "@/lib/schedule/types";

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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 border border-ink px-2 py-0.5 text-[12px] font-bold uppercase hover:bg-ink hover:text-paper"
        >
          ✕
        </button>
      </div>

      {event.titleEn && (
        <p className="mt-0.5 text-[13px] text-ink-mid">EN: {event.titleEn}</p>
      )}

      <dl className="mt-3 space-y-1 text-[13px]">
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">Time</dt>
          <dd className="tnum">
            {event.kind === "moment"
              ? `◆ ${formatTimeRange(event.start, event.end, false).split("–")[0]} sharp`
              : formatTimeRange(event.start, event.end, event.estimated)}
            {event.estimated && (
              <span className="ml-1 text-ink-mid">
                (no end time published)
              </span>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">Location</dt>
          <dd>
            {venue?.name ?? event.venueId}
            {secondary && <> ⇄ {secondary.name}</>}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-bold uppercase">Type</dt>
          <dd className="uppercase tracking-[0.04em]">
            {event.categories.join(" · ")}
          </dd>
        </div>
      </dl>

      {event.excerpt && (
        <p className="mt-3 border-t border-rule pt-3 text-[14px] leading-relaxed">
          {event.excerpt}
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
              className="border border-ink bg-ink px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em] text-paper hover:bg-spot hover:border-spot"
            >
              ● Watch · {hostOf(url)}
            </a>
          ))}
          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="border border-ink px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em] hover:bg-rule/50"
            >
              Official page ↗
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
