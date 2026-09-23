'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Odświeża stronę co kilka sekund, dopóki płatność nie zostanie potwierdzona. */
export function AutoRefresh({ intervalMs = 3000, maxTries = 40 }: { intervalMs?: number; maxTries?: number }) {
  const router = useRouter();
  const tries = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      tries.current += 1;
      if (tries.current > maxTries) return clearInterval(id);
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, maxTries]);
  return null;
}
