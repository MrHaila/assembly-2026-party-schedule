/**
 * The one and only segmented switch in the header (design-log #13).
 *
 * Both header controls (day shortcuts, language) render through this, so
 * padding, type scale, borders and the hover/active contract can never
 * diverge. Deliberately closed: no className, no style, no size/variant
 * props — the only knobs are the data and the ARIA role.
 */

export interface SegmentedOption {
  /** Stable value passed back to onSelect. */
  id: string;
  /** Already-localized label. */
  label: string;
}

interface SegmentedToggleProps {
  options: readonly SegmentedOption[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Accessible name for the group. */
  label: string;
  /**
   * `tabs` = navigational shortcuts (role=tablist/tab + aria-selected),
   * `switch` = a setting with two-plus states (role=group + aria-pressed).
   */
  semantics: "tabs" | "switch";
}

export function SegmentedToggle({
  options,
  activeId,
  onSelect,
  label,
  semantics,
}: SegmentedToggleProps) {
  const tabs = semantics === "tabs";
  return (
    <div
      role={tabs ? "tablist" : "group"}
      aria-label={label}
      className="flex shrink-0 border border-strong"
    >
      {options.map((option) => {
        const active = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            role={tabs ? "tab" : undefined}
            aria-selected={tabs ? active : undefined}
            aria-pressed={tabs ? undefined : active}
            onClick={() => onSelect(option.id)}
            // Active is a dead end: already-selected segments must not
            // light up on hover, so only inactive segments get .press.
            className={`px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100 ${
              active ? "bg-ink text-paper" : "press bg-paper text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
