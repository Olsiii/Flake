import { beforeEach, describe, expect, it } from "vitest";
import { getConsent, hasConsent, saveConsent } from "./consent";

describe("consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no choice has been made", () => {
    expect(getConsent()).toBeNull();
    expect(hasConsent("analytics")).toBe(false);
  });

  it("persists a saved choice and reflects it via hasConsent", () => {
    saveConsent({ functional: true, analytics: true, marketing: false });

    expect(hasConsent("functional")).toBe(true);
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("marketing")).toBe(false);
    expect(getConsent()?.necessary).toBe(true);
  });

  it("ignores unparsable stored values", () => {
    window.localStorage.setItem("cookie_consent", "not json");
    expect(getConsent()).toBeNull();
  });
});
