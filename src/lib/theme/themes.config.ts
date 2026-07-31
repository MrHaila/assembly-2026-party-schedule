import modernShot from "@/assets/theme-modern.jpg.asset.json";

/**
 * The catalogue of visual themes. `available: false` entries are announced in
 * the picker but cannot be selected — the theme engine itself lands later.
 */
export interface ThemeOption {
  readonly id: string;
  readonly name: string;
  /** Key into the i18n strings object so blurbs stay translated. */
  readonly blurbKey: "themeModernBlurb" | "themeKuakeBlurb";
  /** Screenshot of the theme, or null while it is still being built. */
  readonly preview: string | null;
  readonly available: boolean;
}

export const THEMES: readonly ThemeOption[] = [
  {
    id: "modern",
    name: "Modern",
    blurbKey: "themeModernBlurb",
    preview: modernShot.url,
    available: true,
  },
  {
    id: "kuake",
    name: "Kuake",
    blurbKey: "themeKuakeBlurb",
    preview: null,
    available: false,
  },
] as const;

export const DEFAULT_THEME_ID = "modern";
