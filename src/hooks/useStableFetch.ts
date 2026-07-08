import { useRef, useEffect, useCallback } from 'react';

export function useStableFetch() {
  const requestId = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false };
  }, []);

  const nextId = useCallback(() => ++requestId.current, []);

  const isStale = useCallback((id: number) => {
    return id !== requestId.current || !mountedRef.current;
  }, []);

  return { requestId, mountedRef, nextId, isStale };
}
