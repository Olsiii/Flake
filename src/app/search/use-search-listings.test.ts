import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS, type MapBounds } from "@/types/listing";
import { useSearchListings } from "./use-search-listings";

const rpcMock = vi.fn();
vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowser: () => ({ rpc: rpcMock }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// Two extra microtask ticks after resolving a mock RPC promise by hand
// (i.e. outside a faked-timer callback) is enough to let the hook's
// `await supabase.rpc(...)` continuation and its setState calls run.
async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

const bounds1: MapBounds = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
const bounds2: MapBounds = { minLng: 2, minLat: 2, maxLng: 3, maxLat: 3 };

describe("useSearchListings", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rpcMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not query when there are no bounds and no polygon", async () => {
    renderHook(() =>
      useSearchListings({
        bounds: null,
        polygonGeoJson: null,
        filters: DEFAULT_FILTERS,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("debounces rapid bounds changes into a single request for the latest bounds", async () => {
    rpcMock.mockReturnValue(new Promise(() => {})); // never resolves — only call count/args matter here

    const { rerender } = renderHook(
      ({ bounds }) =>
        useSearchListings({
          bounds,
          polygonGeoJson: null,
          filters: DEFAULT_FILTERS,
        }),
      { initialProps: { bounds: bounds1 } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    rerender({ bounds: bounds2 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    // Only 100ms since the bounds2 change — still inside the 300ms window.
    expect(rpcMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "search_listings_bbox",
      expect.objectContaining({ min_lng: bounds2.minLng, min_lat: bounds2.minLat }),
    );
  });

  it("drops a stale response superseded by a newer request", async () => {
    const first = deferred<{ data: unknown; error: null }>();
    const second = deferred<{ data: unknown; error: null }>();
    rpcMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ bounds }) =>
        useSearchListings({
          bounds,
          polygonGeoJson: null,
          filters: DEFAULT_FILTERS,
        }),
      { initialProps: { bounds: bounds1 } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(rpcMock).toHaveBeenCalledTimes(1);

    rerender({ bounds: bounds2 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(rpcMock).toHaveBeenCalledTimes(2);

    // Newer request resolves first (as if the network raced)...
    await act(async () => {
      second.resolve({ data: [{ id: "b" }], error: null });
      await flushMicrotasks();
    });
    expect(result.current.listings).toEqual([{ id: "b" }]);

    // ...then the superseded first request resolves after — must be ignored.
    await act(async () => {
      first.resolve({ data: [{ id: "a" }], error: null });
      await flushMicrotasks();
    });
    expect(result.current.listings).toEqual([{ id: "b" }]);
  });

  it("sets error and clears listings on an RPC error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    const { result } = renderHook(() =>
      useSearchListings({
        bounds: bounds1,
        polygonGeoJson: null,
        filters: DEFAULT_FILTERS,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.error).toBe("boom");
    expect(result.current.listings).toEqual([]);
  });

  it("queries by polygon (not bbox) when a drawn polygon is present", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    renderHook(() =>
      useSearchListings({
        bounds: bounds1,
        polygonGeoJson: '{"type":"Polygon"}',
        filters: DEFAULT_FILTERS,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(rpcMock).toHaveBeenCalledWith(
      "search_listings_polygon",
      expect.objectContaining({ p_polygon_geojson: '{"type":"Polygon"}' }),
    );
  });
});
