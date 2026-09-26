import Link from 'next/link';
import { siteConfig } from '@/lib/config';

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${siteConfig.name} — strona główna`}>
      <svg aria-hidden width="30" height="30" viewBox="0 0 64 64" className="shrink-0">
        <circle cx="27" cy="27" r="14" fill="none" stroke="#d4b06a" strokeWidth="5" />
        <path d="M37 37 51 51" stroke="#d4b06a" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <span className="whitespace-nowrap font-serif text-base font-bold uppercase tracking-[0.08em] text-paper-50 transition group-hover:text-brass-300 sm:text-lg sm:tracking-[0.12em]">
        {siteConfig.name}
      </span>
    </Link>
  );
}
