import { SWATCH_CLASS, swatchFor } from "@/lib/schedule/categories";

interface FilterBadgeProps {
  /** Normalized category slug. */
  category: string;
  /** Already-localized display label. */
  label: string;
  /** How many events in the loaded schedule carry this type. */
  count: number;
  /** Rendered muted when the type currently sits in the HIDING row. */
  hidden: boolean;
  onToggle: (category: string) => void;
}

/**
 * One clickable event-type chip. Closed by design: no className, no style —
 * the swatch always comes from the shared category palette so the badge and
 * the event's left bar can never disagree.
 */
export function FilterBadge({
  category,
  label,
  count,
  hidden,
  onToggle,
}: FilterBadgeProps) {
  const swatch = swatchFor(category);
  return (
    <button
      type="button"
      aria-pressed={!hidden}
      onClick={() => onToggle(category)}
      className={`press inline-flex items-center gap-1.5 border py-0.5 pl-0 pr-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors duration-100 ${
        hidden
          ? "border-rule bg-paper text-ink-mid line-through"
          : "border-strong bg-paper text-ink"
      }`}
    >
      <span
        aria-hidden
        className={`h-[16px] w-[3px] shrink-0 ${
          hidden ? "bg-rule" : SWATCH_CLASS[swatch]
        }`}
      />
      {label}
      <span className="tnum font-normal text-ink-mid">{count}</span>
    </button>
  );
}
