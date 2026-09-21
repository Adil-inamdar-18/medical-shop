"use client";

import { useCallback, useEffect, useState } from "react";

interface Result<T> {
  key: number;
  data: T | null;
  error: string | null;
}

/**
 * Loads data when the component mounts and whenever `reload()` is called.
 * Pass a stable function (declared outside the component).
 */
export function useFetch<T>(fetcher: () => Promise<T>) {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Result<T>>({
    key: -1,
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ key: reloadKey, data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult((previous) => ({
          key: reloadKey,
          data: previous.data,
          error:
            error instanceof Error ? error.message : "Something went wrong",
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    data: result.data,
    error: result.error,
    loading: result.key !== reloadKey,
    reload,
  };
}
