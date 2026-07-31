/**
 * The coalescer is the one caching primitive with real timing subtlety, so it
 * gets exhaustive unit coverage. A manual scheduler makes every flush
 * deterministic — no timers, no fake clocks.
 */
import { describe, expect, it, vi } from "vitest";
import { createBatchLoader } from "@/lib/api/batch-loader";

/** A scheduler we flush by hand, so batching windows are explicit in tests. */
function manualScheduler() {
  const pending: Array<() => void> = [];
  return {
    schedule: (flush: () => void) => pending.push(flush),
    /** Run every deferred flush queued so far. */
    tick: () => {
      const run = pending.splice(0);
      for (const flush of run) flush();
    },
  };
}

describe("createBatchLoader", () => {
  it("gathers all loads in one tick into a single batchFn call", async () => {
    const { schedule, tick } = manualScheduler();
    const batchFn = vi.fn(async (keys: number[]) =>
      new Map(keys.map((k) => [k, k * 10])),
    );
    const loader = createBatchLoader({ batchFn, schedule });

    const p1 = loader.load(1);
    const p2 = loader.load(2);
    const p3 = loader.load(3);
    expect(batchFn).not.toHaveBeenCalled(); // nothing until the tick

    tick();
    expect(await Promise.all([p1, p2, p3])).toEqual([10, 20, 30]);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("dedups a key requested twice in the same batch", async () => {
    const { schedule, tick } = manualScheduler();
    const batchFn = vi.fn(async (keys: number[]) =>
      new Map(keys.map((k) => [k, k])),
    );
    const loader = createBatchLoader({ batchFn, schedule });

    const a = loader.load(7);
    const b = loader.load(7);
    tick();

    expect(await a).toBe(7);
    expect(await b).toBe(7);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([7]); // key appears once
  });

  it("reuses the in-flight promise for a key still being fetched", async () => {
    const { schedule, tick } = manualScheduler();
    let releaseBatch!: (map: Map<number, string>) => void;
    const batchFn = vi.fn(
      (keys: number[]) =>
        new Promise<ReadonlyMap<number, string>>((resolve) => {
          releaseBatch = (map) => resolve(map);
          void keys;
        }),
    );
    const loader = createBatchLoader({ batchFn, schedule });

    const first = loader.load(5);
    tick(); // batch sent, now awaiting the network

    const second = loader.load(5); // same key, mid-flight
    tick(); // must NOT start a second batch

    releaseBatch(new Map([[5, "five"]]));
    expect(await first).toBe("five");
    expect(await second).toBe("five");
    expect(batchFn).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh batch for a key loaded after the previous settled", async () => {
    const { schedule, tick } = manualScheduler();
    const batchFn = vi.fn(async (keys: number[]) =>
      new Map(keys.map((k) => [k, k])),
    );
    const loader = createBatchLoader({ batchFn, schedule });

    const first = loader.load(1);
    tick();
    await first;

    const second = loader.load(1); // cache-free layer: fetches again
    tick();
    await second;

    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it("resolves undefined for a key missing from the batch result", async () => {
    const { schedule, tick } = manualScheduler();
    const batchFn = vi.fn(async () => new Map<number, string>()); // returns nothing
    const loader = createBatchLoader({ batchFn, schedule });

    const p = loader.load(42);
    tick();
    expect(await p).toBeUndefined();
  });

  it("rejects every pending load when batchFn throws", async () => {
    const { schedule, tick } = manualScheduler();
    const boom = new Error("network down");
    const batchFn = vi.fn(async () => {
      throw boom;
    });
    const loader = createBatchLoader({ batchFn, schedule });

    const a = loader.load(1);
    const b = loader.load(2);
    tick();

    await expect(a).rejects.toBe(boom);
    await expect(b).rejects.toBe(boom);
    expect(batchFn).toHaveBeenCalledTimes(1);
  });

  it("defaults to queueMicrotask when no scheduler is injected", async () => {
    const batchFn = vi.fn(async (keys: number[]) =>
      new Map(keys.map((k) => [k, k])),
    );
    const loader = createBatchLoader({ batchFn });

    const p1 = loader.load(1);
    const p2 = loader.load(2);
    // Still same tick — microtask has not drained yet.
    expect(batchFn).not.toHaveBeenCalled();

    expect(await Promise.all([p1, p2])).toEqual([1, 2]);
    expect(batchFn).toHaveBeenCalledTimes(1);
  });
});
