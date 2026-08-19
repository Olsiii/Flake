import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isGloballyRateLimited, isRateLimited } from "./rate-limit";

function requestFrom(ip: string): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then rejects the next request", () => {
    const req = requestFrom("1.1.1.1");
    const key = `route-a-${Math.random()}`;

    for (let i = 0; i < 3; i++) {
      expect(isRateLimited(req, key, 3, 60_000)).toBe(false);
    }
    expect(isRateLimited(req, key, 3, 60_000)).toBe(true);
  });

  it("resets the count once the window elapses", () => {
    const req = requestFrom("2.2.2.2");
    const key = `route-b-${Math.random()}`;

    expect(isRateLimited(req, key, 1, 60_000)).toBe(false);
    expect(isRateLimited(req, key, 1, 60_000)).toBe(true);

    vi.advanceTimersByTime(60_001);

    expect(isRateLimited(req, key, 1, 60_000)).toBe(false);
  });

  it("tracks separate IPs independently under the same routeKey", () => {
    const key = `route-c-${Math.random()}`;

    expect(isRateLimited(requestFrom("3.3.3.3"), key, 1, 60_000)).toBe(false);
    // A different IP hasn't used its allowance yet, even though the same
    // route just got exhausted by 3.3.3.3.
    expect(isRateLimited(requestFrom("4.4.4.4"), key, 1, 60_000)).toBe(false);
    expect(isRateLimited(requestFrom("3.3.3.3"), key, 1, 60_000)).toBe(true);
  });

  it("falls back to x-real-ip, then 'unknown', when x-forwarded-for is absent", () => {
    const key = `route-d-${Math.random()}`;
    const realIpReq = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "5.5.5.5" },
    });
    const noHeaderReq = new Request("http://localhost/api/test");

    expect(isRateLimited(realIpReq, key, 1, 60_000)).toBe(false);
    expect(isRateLimited(realIpReq, key, 1, 60_000)).toBe(true);

    // "unknown" bucket is separate from the x-real-ip bucket above.
    expect(isRateLimited(noHeaderReq, key, 1, 60_000)).toBe(false);
  });

  it("only trusts the first hop of a comma-separated x-forwarded-for", () => {
    const key = `route-e-${Math.random()}`;
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "6.6.6.6, 7.7.7.7, 8.8.8.8" },
    });

    expect(isRateLimited(req, key, 1, 60_000)).toBe(false);
    expect(isRateLimited(req, key, 1, 60_000)).toBe(true);
    // Same leading IP with different trailing hops still hits the same bucket.
    expect(
      isRateLimited(
        new Request("http://localhost/api/test", {
          headers: { "x-forwarded-for": "6.6.6.6, 9.9.9.9" },
        }),
        key,
        1,
        60_000,
      ),
    ).toBe(true);
  });
});

describe("isGloballyRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores request identity entirely — same bucket regardless of IP", () => {
    const key = `global-a-${Math.random()}`;

    expect(isGloballyRateLimited(key, 2, 60_000)).toBe(false);
    expect(isGloballyRateLimited(key, 2, 60_000)).toBe(false);
    expect(isGloballyRateLimited(key, 2, 60_000)).toBe(true);
  });

  it("is keyed independently from isRateLimited's per-IP buckets", () => {
    const routeKey = `shared-key-${Math.random()}`;
    const req = requestFrom("10.10.10.10");

    expect(isRateLimited(req, routeKey, 1, 60_000)).toBe(false);
    // Exhausting the per-IP bucket doesn't touch the global bucket for the
    // same routeKey.
    expect(isGloballyRateLimited(routeKey, 1, 60_000)).toBe(false);
  });
});
