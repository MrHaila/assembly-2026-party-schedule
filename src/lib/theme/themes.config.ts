import modernShot from "@/assets/theme-modern.jpg.asset.json";

/**
 * The catalogue of visual themes. `available: false` entries are announced in
 * the picker but cannot be selected — the theme engine itself lands later.
 */
export interface ThemeOption {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  /** Screenshot of the theme, or null while it is still being built. */
  readonly preview: string | null;
  readonly available: boolean;
}

export const THEMES: readonly ThemeOption[] = [
  {
    id: "modern",
    name: "Modern",
    blurb: "Dark LAN-hall listings. Hairline rules, tabular time, no chrome.",
    preview: modernShot.url,
    available: true,
  },
  {
    id: "kuake",
    name: "Kuake",
    blurb: "A heavier, arena-flavoured take on the same schedule.",
    preview: null,
    available: false,
  },
] as const;

export const DEFAULT_THEME_ID = "modern";
