// Fixed-cardinality process-local safeguards, not a distributed or per-client edge limiter.
export function createRequestGate(capacity: number, perMinute = Infinity, now = () => Date.now()) {
  let active = 0;
  let attempts = 0;
  let reset = 0;
  return {
    enter(): { release: () => void } | { retryAfter: number } {
      const time = now();
      if (time >= reset) { attempts = 0; reset = time + 60_000; }
      if (attempts >= perMinute) return { retryAfter: Math.max(1, Math.ceil((reset - time) / 1000)) };
      if (active >= capacity) return { retryAfter: 1 };
      attempts++;
      active++;
      let released = false;
      return { release() { if (!released) { released = true; active--; } } };
    },
  };
}

export const serverFetchGate = createRequestGate(16);
export const editorialSearchGate = createRequestGate(4, 60);
