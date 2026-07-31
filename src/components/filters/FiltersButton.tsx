import { useFilters } from "@/hooks/use-filters";
import { useLanguage } from "@/hooks/use-language";

interface FiltersButtonProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * Header control that opens the filter drawer. Matches the SegmentedToggle
 * contract visually (same border, type scale, press states) and carries the
 * count of currently hidden event types.
 */
export function FiltersButton({ open, onToggle }: FiltersButtonProps) {
  const { hidden } = useFilters();
  const { t } = useLanguage();
  const count = hidden.size;
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className={`flex shrink-0 items-center gap-1.5 border border-strong px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100 ${
        open ? "bg-ink text-paper" : "press bg-paper text-ink"
      }`}
    >
      {t.filters}
      {count > 0 && (
        <span
          className={`tnum inline-flex min-w-[16px] justify-center px-1 text-[11px] leading-[14px] ${
            open ? "bg-paper text-ink" : "bg-ink text-paper"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
