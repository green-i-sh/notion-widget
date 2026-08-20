import { useEffect, useState } from "react";

/**
 * Fetches once on mount (or when `deps` changes) and ignores a stale
 * response if the component unmounts first. Every Notion-backed widget
 * repeated this exact effect — this is the one copy.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetcher()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error };
}
