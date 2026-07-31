/**
 * A tiny DataLoader-style coalescer — the one genuinely tricky bit of the
 * caching story, so it lives here as a pure, framework-free, unit-tested unit.
 *
 * What it guarantees:
 * 1. Batching — every `load()` call made within one scheduler tick is gathered
 *    into a single `batchFn(keys)` call. The prefetch-a-whole-day path turns
 *    into one network round trip.
 * 2. Dedup — the same key requested twice in a batch is passed to `batchFn`
 *    once; both callers get the one result.
 * 3. In-flight coalescing — a key requested again while its batch is still
 *    awaiting the network reuses the pending promise instead of starting a
 *    second fetch.
 *
 * There is NO time-based expiry here on purpose: freshness/TTL is React
 * Query's job (staleTime/gcTime). This layer only collapses concurrent reads.
 *
 * `schedule` is injectable so tests flush deterministically without timers.
 * Default is `queueMicrotask`: it drains after the current synchronous stack,
 * so a `for` loop of `load()` calls all land in the same batch.
 */

export interface BatchLoaderOptions<K, V> {
  /**
   * Resolve a batch of unique keys. Return a map from key to value; a key
   * absent from the map resolves to `undefined` (a legitimate "not found").
   */
  batchFn: (keys: K[]) => Promise<ReadonlyMap<K, V>>;
  /** Defer a flush to the end of the current tick. Defaults to queueMicrotask. */
  schedule?: (flush: () => void) => void;
}

export interface BatchLoader<K, V> {
  load: (key: K) => Promise<V | undefined>;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function createBatchLoader<K, V>({
  batchFn,
  schedule = queueMicrotask,
}: BatchLoaderOptions<K, V>): BatchLoader<K, V> {
  // Keys collected for the next flush, not yet sent.
  const batch = new Map<K, Deferred<V | undefined>>();
  // Keys already sent and awaiting the network — reused for coalescing.
  const inFlight = new Map<K, Promise<V | undefined>>();

  const flush = () => {
    if (batch.size === 0) return;
    const entries = [...batch.entries()];
    batch.clear();

    const keys = entries.map(([key]) => key);
    for (const [key, deferred] of entries) {
      inFlight.set(key, deferred.promise);
    }

    batchFn(keys).then(
      (result) => {
        for (const [key, deferred] of entries) {
          inFlight.delete(key);
          deferred.resolve(result.get(key));
        }
      },
      (error: unknown) => {
        for (const [key, deferred] of entries) {
          inFlight.delete(key);
          deferred.reject(error);
        }
      },
    );
  };

  const load = (key: K): Promise<V | undefined> => {
    const pending = inFlight.get(key);
    if (pending) return pending;

    const queued = batch.get(key);
    if (queued) return queued.promise;

    const deferred = defer<V | undefined>();
    const wasEmpty = batch.size === 0;
    batch.set(key, deferred);
    if (wasEmpty) schedule(flush);
    return deferred.promise;
  };

  return { load };
}
