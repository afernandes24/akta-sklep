'use client';

import { useEffect } from 'react';
import { trackPurchase, trackViewItem } from '@/lib/analytics';

export function TrackViewItem({ id, title, priceGrosze }: { id: string; title: string; priceGrosze: number }) {
  useEffect(() => {
    // Małe opóźnienie — skrypty ładowane są po hydratacji
    const t = setTimeout(() => trackViewItem({ id, title, priceGrosze }), 1500);
    return () => clearTimeout(t);
  }, [id, title, priceGrosze]);
  return null;
}

export function TrackPurchase(props: { id: string; totalGrosze: number; items: { id: string; title: string; priceGrosze: number }[] }) {
  useEffect(() => {
    const t = setTimeout(() => trackPurchase(props), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);
  return null;
}
