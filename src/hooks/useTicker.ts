import { useEffect, useRef, useState } from "react";

/**
 * Elapsed milliseconds while running. Timestamp-based, so it stays accurate
 * when the tab is throttled in a background iframe.
 */
export function useTicker(running: boolean): {
  elapsed: number;
  reset: () => void;
} {
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!running) {
      if (startedAt.current !== null) {
        base.current += Date.now() - startedAt.current;
        startedAt.current = null;
      }
      return;
    }
    startedAt.current = Date.now();
    const id = window.setInterval(() => {
      const since = startedAt.current === null ? 0 : Date.now() - startedAt.current;
      setElapsed(base.current + since);
    }, 100);
    return () => window.clearInterval(id);
  }, [running]);

  const reset = () => {
    base.current = 0;
    startedAt.current = running ? Date.now() : null;
    setElapsed(0);
  };

  return { elapsed, reset };
}
