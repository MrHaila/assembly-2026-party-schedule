import * as Dialog from "@radix-ui/react-dialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { useLanguage } from "@/hooks/use-language";
import { DEFAULT_THEME_ID, THEMES, type ThemeOption } from "@/lib/theme/themes.config";

interface ThemesDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Theme picker. Same sheet/panel chrome as the event detail so the app only
 * ever has one modal shape. Selection is inert until the theme engine lands:
 * MODERN is the active theme, KUAKE is announced only.
 */
export function ThemesDialog({ open, onClose }: ThemesDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] overflow-y-auto border-t-2 border-strong bg-surface p-4 pb-8 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(560px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border-2"
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-[20px] font-bold uppercase leading-tight tracking-[0.06em]">
              {t.themes}
            </Dialog.Title>
            <ActionButton tone="outline" onClick={onClose} label={t.close}>
              <span aria-hidden>✕</span>
            </ActionButton>
          </div>

          <p className="mt-1 text-[12px] uppercase tracking-[0.06em] text-ink-mid">
            {t.themesHint}
          </p>

          <ul className="mt-3 space-y-3">
            {THEMES.map((theme) => (
              <li key={theme.id}>
                <ThemeCard theme={theme} />
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ThemeCard({ theme }: { theme: ThemeOption }) {
  const { t } = useLanguage();
  const active = theme.available && theme.id === DEFAULT_THEME_ID;
  return (
    <article
      className={`border ${active ? "border-strong" : "border-rule"} bg-paper`}
    >
      <div className="aspect-[16/10] w-full overflow-hidden border-b border-rule bg-band">
        {theme.preview ? (
          <img
            src={theme.preview}
            alt={`${theme.name} theme preview`}
            loading="lazy"
            className={`h-full w-full object-cover object-top ${active ? "" : "opacity-60"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mid">
            {t.themeComingSoon}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 p-2.5">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold uppercase tracking-[0.08em]">
            {theme.name}
          </h3>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-mid">
            {theme.blurb}
          </p>
        </div>
        <span
          className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${
            active
              ? "border-strong bg-ink text-paper"
              : "border-rule text-ink-mid"
          }`}
        >
          {active ? t.themeActive : t.themeComingSoon}
        </span>
      </div>
    </article>
  );
}
