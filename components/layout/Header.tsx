import Link from 'next/link';
import { CartLink } from '../cart/CartLink';
import { AccountLink } from './AccountLink';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { mainNav } from './nav';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur supports-[backdrop-filter]:bg-ink-950/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu główne">
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded px-3 py-2 text-sm text-paper-200 transition hover:text-brass-300">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center">
          <div className="hidden lg:block">
            <AccountLink />
          </div>
          <CartLink />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
