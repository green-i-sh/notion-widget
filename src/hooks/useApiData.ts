import { useEffect, useRef, useState } from "react";

export interface FetchOpts {
  /** Bypass server/CDN cache — used right after a write, so the next read is fresh. */
  bust?: boolean;
}

/**
 * Fetches on mount and keeps refetching: every 60s, and whenever the tab
 * regains visibility or focus (covers "edited in Notion, switched back").
 * Every Notion-backed widget needs this exact behavior — this is the one copy.
 *
 * Stale data stays on screen during a refetch — only the first load shows
 * the empty state, so polling never blinks the widget back to "불러오는 중".
 */
export function useApiData<T>(
  fetcher: (opts?: FetchOpts) => Promise<T>,
  deps: unknown[] = []
): { data: T | null; error: string | null; refresh: (opts?: FetchOpts) => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    const load = (opts?: FetchOpts) => {
      fetcherRef.current(opts)
        .then((d) => { if (!cancelled) { setData(d); setError(null); } })
        .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    };

    load();
    const interval = setInterval(() => load(), 60_000);
    const onWake = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = (opts?: FetchOpts) =>
    fetcherRef.current(opts)
      .then((d) => { setData(d); setError(null); })
      .catch((err) => { setError(err instanceof Error ? err.message : String(err)); });

  return { data, error, refresh };
}
