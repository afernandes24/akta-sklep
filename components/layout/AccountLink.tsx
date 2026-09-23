'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient, isBrowserSupabaseConfigured } from '@/lib/supabase/client';

export function AccountLink({ onNavigate }: { onNavigate?: () => void }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) {
      setLoggedIn(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, [pathname]);

  return (
    <Link href={loggedIn ? '/konto' : '/logowanie'} onClick={onNavigate} className="btn-ghost">
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
      </svg>
      <span>{loggedIn ? 'Moje konto' : 'Zaloguj się'}</span>
    </Link>
  );
}
