import { describe, expect, it } from "vitest";
import {
  isRefusedHost,
  shouldRegister,
} from "../src/lib/pwa-register";

// Simulate the module-scope browser environment for the tests.
function withWindowEnv(
  overrides: {
    hostname?: string;
    search?: string;
    prod?: boolean;
    top?: Window;
    serviceWorker?: boolean;
  },
  fn: () => void,
) {
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;
  const originalLocation = globalThis.location;

  const mockNavigator = {
    serviceWorker: overrides.serviceWorker !== false ? {} : undefined,
  } as Navigator;

  const mockWindow = {
    self: {} as Window,
    top: overrides.top === undefined ? ({} as Window) : overrides.top,
    location: {
      hostname: overrides.hostname ?? "assembly.haila.fi",
      search: overrides.search ?? "",
    } as Location,
  } as Window;

  // @ts-expect-error — test harness only
  globalThis.navigator = mockNavigator;
  // @ts-expect-error — test harness only
  globalThis.window = mockWindow;
  // @ts-expect-error — test harness only
  globalThis.location = mockWindow.location;

  // import.meta.env.PROD is read in the module; we cannot change it per-test
  // without re-evaluating. Instead, run the hostname/refused-host tests.

  try {
    fn();
  } finally {
    // @ts-expect-error — test harness only
    globalThis.navigator = originalNavigator;
    // @ts-expect-error — test harness only
    globalThis.window = originalWindow;
    // @ts-expect-error — test harness only
    globalThis.location = originalLocation;
  }
}

describe("isRefusedHost", () => {
  it("allows localhost", () => {
    expect(isRefusedHost("localhost")).toBe(false);
  });

  it("allows production domains", () => {
    expect(isRefusedHost("assembly.haila.fi")).toBe(false);
    expect(isRefusedHost("assembly-schedule.lovable.app")).toBe(false);
  });

  it("refuses Lovable preview hosts", () => {
    expect(isRefusedHost("id-preview--foo.lovable.app")).toBe(true);
    expect(isRefusedHost("preview--bar.lovable.app")).toBe(true);
  });

  it("refuses Lovable project hosts", () => {
    expect(isRefusedHost("lovableproject.com")).toBe(true);
    expect(isRefusedHost("my.lovableproject.com")).toBe(true);
    expect(isRefusedHost("lovableproject-dev.com")).toBe(true);
    expect(isRefusedHost("my.lovableproject-dev.com")).toBe(true);
    expect(isRefusedHost("beta.lovable.dev")).toBe(true);
    expect(isRefusedHost("my.beta.lovable.dev")).toBe(true);
  });
});

describe("shouldRegister", () => {
  it("returns false when navigator is missing", () => {
    withWindowEnv({ serviceWorker: false }, () => {
      expect(shouldRegister()).toBe(false);
    });
  });

  it("returns false inside an iframe", () => {
    withWindowEnv({ top: {} as Window }, () => {
      // self !== top, so it's an iframe
      expect(shouldRegister()).toBe(false);
    });
  });

  it("returns false for Lovable preview hosts", () => {
    withWindowEnv({ hostname: "id-preview--foo.lovable.app" }, () => {
      expect(shouldRegister()).toBe(false);
    });
  });

  it("returns false with ?sw=off", () => {
    withWindowEnv({ search: "?sw=off" }, () => {
      expect(shouldRegister()).toBe(false);
    });
  });
});
