import { afterEach, describe, expect, it, vi } from "vitest";
import { isRefusedHost, shouldRegister } from "../src/lib/pwa-register";

afterEach(() => {
  vi.unstubAllGlobals();
});

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
  const mockWindow = {
    self: {} as Window,
    top: overrides.top === undefined ? ({} as Window) : overrides.top,
    location: {
      hostname: overrides.hostname ?? "assembly.haila.fi",
      search: overrides.search ?? "",
    } as Location,
  } as Window;

  vi.stubGlobal("window", mockWindow);
  vi.stubGlobal("location", mockWindow.location);

  // Default serviceWorker to true unless explicitly disabled.
  if (overrides.serviceWorker !== false) {
    vi.stubGlobal("navigator", { serviceWorker: {} } as Navigator);
  }

  fn();
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
    vi.stubGlobal("navigator", undefined);
    expect(shouldRegister()).toBe(false);
  });

  it("returns false inside an iframe", () => {
    withWindowEnv({ top: {} as Window }, () => {
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

