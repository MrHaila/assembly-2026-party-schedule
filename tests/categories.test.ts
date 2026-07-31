import { describe, expect, it } from "vitest";
import {
  barSwatches,
  CATEGORY_PALETTE,
  CATEGORY_SWATCHES,
  SWATCH_CLASS,
  swatchFor,
} from "../src/lib/schedule/categories";

describe("category colours", () => {
  it("has more palette swatches than distinct assigned colours", () => {
    const used = new Set(Object.values(CATEGORY_SWATCHES));
    expect(CATEGORY_PALETTE.length).toBeGreaterThan(used.size - 1);
    expect(CATEGORY_PALETTE.length).toBe(new Set(CATEGORY_PALETTE).size);
  });

  it("maps every palette token and gold to a static class", () => {
    for (const swatch of CATEGORY_PALETTE) {
      expect(SWATCH_CLASS[swatch]).toBe(`bg-${swatch}`);
    }
    expect(SWATCH_CLASS.gold).toBe("bg-gold");
  });

  it("is stable for unknown categories", () => {
    const a = swatchFor("brand-new-thing");
    expect(CATEGORY_PALETTE).toContain(a);
    expect(swatchFor("brand-new-thing")).toBe(a);
  });

  it("stacks one segment per distinct colour", () => {
    expect(barSwatches(["expo", "gaming"], false)).toEqual([
      "cat-orange",
      "cat-blue",
    ]);
    // musiikki and tanssi share a swatch — no duplicate stripe.
    expect(barSwatches(["musiikki", "tanssi"], false)).toEqual(["cat-magenta"]);
    expect(barSwatches([], false)).toEqual(["cat-slate"]);
  });

  it("caps the stack at four segments", () => {
    expect(
      barSwatches(
        ["expo", "gaming", "osallistu", "creators", "demoscene"],
        false,
      ),
    ).toHaveLength(4);
  });

  it("lets favourites override every category colour", () => {
    expect(barSwatches(["expo", "gaming"], true)).toEqual(["gold"]);
  });
});
