import Link from 'next/link';
import { CookieSettingsLink } from '../consent/CookieBanner';
import { siteConfig } from '@/lib/config';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-800 bg-ink-950">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Fabularne gry detektywistyczne do druku. Pobierasz akta, drukujesz dowody i sam prowadzisz śledztwo.
          </p>
        </div>
        <FooterCol
          title="Sklep"
          links={[
            ['/sprawy', 'Wszystkie sprawy'],
            ['/darmowa-sprawa', 'Darmowa sprawa'],
            ['/#jak-to-dziala', 'Jak to działa'],
            ['/koszyk', 'Koszyk'],
          ]}
        />
        <FooterCol
          title="Konto"
          links={[
            ['/logowanie', 'Logowanie'],
            ['/rejestracja', 'Załóż konto'],
            ['/konto/sprawy', 'Moje sprawy'],
          ]}
        />
        <FooterCol
          title="Informacje"
          links={[
            ['/o-nas', 'O nas'],
            ['/faq', 'FAQ'],
            ['/kontakt', 'Kontakt'],
            ['/regulamin', 'Regulamin'],
            ['/zwroty-i-reklamacje', 'Zwroty i reklamacje'],
            ['/polityka-prywatnosci', 'Polityka prywatności'],
            ['/polityka-cookies', 'Polityka cookies'],
            ['/nota-prawna', 'Nota prawna'],
          ]}
        />
      </div>
      <div className="border-t border-ink-800">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Wszystkie postacie i wydarzenia są fikcyjne.</p>
          <p className="font-mono uppercase tracking-widest">Produkt cyfrowy · PDF do druku</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="eyebrow mb-4 font-mono">{title}</h2>
      <ul className="space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-paper-200 transition hover:text-brass-300">
              {label}
            </Link>
          </li>
        ))}
        {title === 'Informacje' && (
          <li>
            <CookieSettingsLink />
          </li>
        )}
      </ul>
    </div>
  );
}
