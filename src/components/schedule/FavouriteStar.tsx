import { useLanguage } from "@/hooks/use-language";
import { ActionButton } from "@/components/ui/ActionButton";

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

const SIZES: Record<Exclude<StarSize, "action">, string> = {
  grid: "absolute right-0 top-0 z-20 h-[18px] w-[18px] text-[12px]",
  inline: "h-[18px] w-[18px] text-[13px]",
};

/**
 * The one and only favourite control. Every surface uses this component so
 * the gold palette and the hover/active contract can never drift.
 * The labelled variant reuses the shared ActionButton geometry.
 */
export function FavouriteStar({
  favourite,
  onToggle,
  size,
}: FavouriteStarProps) {
  const { t } = useLanguage();
  const label = favourite ? t.removeFavourite : t.addFavourite;

  if (size === "action") {
    return (
      <ActionButton
        tone="gold"
        active={favourite}
        pressed={favourite}
        onClick={onToggle}
      >
        <span aria-hidden>{favourite ? "★" : "☆"}</span>
        <span>{label}</span>
      </ActionButton>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={favourite}
      aria-label={label}
      title={label}
      data-favourite={favourite ? "" : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`${BASE} ${SIZES[size]}`}
    >
      <span aria-hidden>{favourite ? "★" : "☆"}</span>
    </button>
  );
}
