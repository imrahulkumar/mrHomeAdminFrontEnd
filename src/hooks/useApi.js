import { useCallback, useEffect, useState } from 'react';

/**
 * Loads data with `loader()` on mount and whenever `deps` change.
 * Returns { data, loading, error, reload, setData }.
 */
export function useApi(loader, deps = [], initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // `loader` is a new function every render; `deps` decide when it should actually re-run.
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await run());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
