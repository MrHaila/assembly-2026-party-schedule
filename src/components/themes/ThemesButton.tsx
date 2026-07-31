import { useLanguage } from "@/hooks/use-language";

interface ThemesButtonProps {
  open: boolean;
  onOpen: () => void;
}

/**
 * Header control that opens the theme picker. Deliberately mirrors
 * FiltersButton's shape so the header controls stay one visual family.
 */
export function ThemesButton({ open, onOpen }: ThemesButtonProps) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onOpen}
      className={`flex shrink-0 items-center border border-strong px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100 ${
        open ? "bg-ink text-paper" : "press bg-paper text-ink"
      }`}
    >
      {t.themes}
    </button>
  );
}
