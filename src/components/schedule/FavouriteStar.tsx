import { useLanguage } from "@/hooks/use-language";

type StarSize = "grid" | "inline" | "action";

interface FavouriteStarProps {
  favourite: boolean;
  onToggle: () => void;
  /** grid = hover-revealed corner button, inline = static row glyph,
   *  action = labelled button inside the detail sheet. */
  size: StarSize;
}

const BASE =
  "press-gold inline-flex shrink-0 items-center justify-center leading-none";

const SIZES: Record<StarSize, string> = {
  grid: "absolute right-0 top-0 z-20 h-[18px] w-[18px] text-[12px]",
  inline: "h-[18px] w-[18px] text-[13px]",
  action:
    "gap-1.5 border border-ink px-2 py-1 text-[12px] font-bold uppercase tracking-[0.05em]",
};

/**
 * The one and only favourite control. Every surface uses this component so
 * the gold palette and the hover/active contract can never drift.
 * Rendered as a real <button>; callers stop propagation for nested cases.
 */
export function FavouriteStar({
  favourite,
  onToggle,
  size,
}: FavouriteStarProps) {
  const { t } = useLanguage();
  const label = favourite ? t.removeFavourite : t.addFavourite;

  return (
    <button
      type="button"
      aria-pressed={favourite}
      aria-label={size === "action" ? undefined : label}
      title={size === "action" ? undefined : label}
      data-favourite={favourite ? "" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`${BASE} ${SIZES[size]}`}
    >
      <span aria-hidden>{favourite ? "★" : "☆"}</span>
      {size === "action" && <span>{label}</span>}
    </button>
  );
}
