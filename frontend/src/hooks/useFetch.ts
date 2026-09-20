import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useFetch<T>(path: string, deps: unknown[] = []): { data: T | null; loading: boolean; error: string | null; retry: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<T>(path)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, attempt, ...deps]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { data, loading, error, retry };
}
