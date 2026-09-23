'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AccountLink } from './AccountLink';
import { mainNav } from './nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="btn-ghost"
        aria-expanded={open}
        aria-controls="menu-mobilne"
        aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div id="menu-mobilne" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-ink-700 bg-ink-950/98 backdrop-blur">
          <nav className="container-page flex flex-col py-6" aria-label="Menu główne">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-ink-800 py-4 font-serif text-xl text-paper-50">
                {item.label}
              </Link>
            ))}
            <div className="mt-6">
              <AccountLink onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
