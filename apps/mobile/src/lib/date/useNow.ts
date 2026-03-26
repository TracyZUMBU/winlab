import { useEffect, useState } from "react";

export type UseNowOptions = {
  /**
   * Refresh interval in ms.
   * For "time remaining" labels, 60s is usually enough and avoids extra renders.
   */
  intervalMs?: number;
};

export function useNow(options: UseNowOptions = {}) {
  const { intervalMs = 60_000 } = options;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return nowMs;
}

