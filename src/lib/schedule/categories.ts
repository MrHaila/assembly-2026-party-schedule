/**
 * Category colour coding — pure, framework-free.
 *
 * A fixed 12-swatch palette chosen for colour-vision deficiency: the hues are
 * derived from the Okabe–Ito CVD-safe set plus four extensions, and every
 * swatch also differs in lightness so protan/deutan/tritan viewers can still
 * tell neighbours apart. The palette is deliberately larger than the number of
 * distinct colours in use, so new categories can be added without a reshuffle.
 *
 * Gold is NOT part of the palette: it is reserved for favourites, which always
 * override category colour (design-log #22).
 */

/** Palette token names. Each maps to a `bg-cat-*` utility in styles.css. */
export const CATEGORY_PALETTE = [
  "cat-vermillion",
  "cat-orange",
  "cat-yellow",
  "cat-olive",
  "cat-green",
  "cat-teal",
  "cat-sky",
  "cat-blue",
  "cat-purple",
  "cat-magenta",
  "cat-pink",
  "cat-slate",
] as const;

export type CategorySwatch = (typeof CATEGORY_PALETTE)[number];

/**
 * Explicit assignment for the categories the summer26 feed ships. Closely
 * related slugs deliberately share a swatch (dance/music, LAN/BYOC, the two
 * K-Week buckets, kids/cosplay) — a colour per near-synonym would push the
 * palette past what stays distinguishable for CVD viewers.
 */
export const CATEGORY_SWATCHES: Readonly<Record<string, CategorySwatch>> = {
  expo: "cat-orange",
  gaming: "cat-blue",
  esports: "cat-sky",
  byoc: "cat-teal",
  "lan-fi": "cat-teal",
  lan: "cat-teal",
  osallistu: "cat-green",
  creators: "cat-yellow",
  viihde: "cat-vermillion",
  musiikki: "cat-magenta",
  tanssi: "cat-magenta",
  demoscene: "cat-purple",
  "k-weekxassembly": "cat-pink",
  "k-pop": "cat-pink",
  kids: "cat-olive",
  cosplay: "cat-olive",
  mainstage: "cat-slate",
  general: "cat-slate",
};

/**
 * Stable fallback for categories added after this file was written: hashed
 * into the palette so the same slug always gets the same swatch.
 */
export function swatchFor(category: string): CategorySwatch {
  const known = CATEGORY_SWATCHES[category];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

/**
 * The stacked bar segments for one event: one swatch per distinct colour, in
 * category order, capped at four so a segment never becomes a sliver.
 * Favourites collapse to a single gold segment — gold always wins.
 */
export function barSwatches(
  categories: readonly string[],
  favourite: boolean,
): ("gold" | CategorySwatch)[] {
  if (favourite) return ["gold"];
  const seen: CategorySwatch[] = [];
  for (const category of categories) {
    const swatch = swatchFor(category);
    if (!seen.includes(swatch)) seen.push(swatch);
    if (seen.length === 4) break;
  }
  return seen.length > 0 ? seen : ["cat-slate"];
}

/** Static class lookup — Tailwind must see every utility as a literal. */
export const SWATCH_CLASS: Readonly<Record<"gold" | CategorySwatch, string>> = {
  gold: "bg-gold",
  "cat-vermillion": "bg-cat-vermillion",
  "cat-orange": "bg-cat-orange",
  "cat-yellow": "bg-cat-yellow",
  "cat-olive": "bg-cat-olive",
  "cat-green": "bg-cat-green",
  "cat-teal": "bg-cat-teal",
  "cat-sky": "bg-cat-sky",
  "cat-blue": "bg-cat-blue",
  "cat-purple": "bg-cat-purple",
  "cat-magenta": "bg-cat-magenta",
  "cat-pink": "bg-cat-pink",
  "cat-slate": "bg-cat-slate",
};
