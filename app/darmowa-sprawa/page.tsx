import type { Metadata } from 'next';
import { CaseCover } from '@/components/case/CaseCover';
import { FreeCaseForm } from '@/components/newsletter/FreeCaseForm';
import { FREE_CASE, NEWSLETTER_CONSENT_TEXT } from '@/lib/newsletter';

export const metadata: Metadata = {
  title: 'Darmowa gra detektywistyczna PDF — sprawa próbna',
  description: 'Pobierz za darmo krótką sprawę detektywistyczną do druku: kradzież w gdańskim antykwariacie, trzech podejrzanych i harcerski szyfr. 30–45 minut gry.',
  alternates: { canonical: '/darmowa-sprawa' },
};

export default function FreeCasePage() {
  return (
    <section className="container-page grid gap-12 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <div className="mx-auto w-full max-w-sm">
        <CaseCover caseNumber={FREE_CASE.number} title={FREE_CASE.title} size="lg" priority />
      </div>
      <div>
        <p className="eyebrow">Akta #{FREE_CASE.number} · za darmo</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">{FREE_CASE.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-paper-200">
          Gdańsk, ulica Mariacka. Z zamkniętej gabloty w antykwariacie znika srebrny zegarek kieszonkowy — pamiątka, której właściciel nigdy nie chciał
          sprzedać. Zamek nieruszony. W sklepie były tylko trzy osoby.
        </p>
        <ul className="mt-6 grid gap-2 text-paper-200 sm:grid-cols-2">
          {['3 etapy śledztwa', '3 podejrzanych', '9 dowodów i harcerski szyfr', '30–45 minut, 12+', 'Pełne rozwiązanie w osobnym pliku', 'PDF do wydrukowania w domu'].map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden className="text-brass-400">◆</span>
              {t}
            </li>
          ))}
        </ul>
        <div className="card mt-8 p-6">
          <h2 className="font-serif text-2xl font-semibold">Odbierz sprawę</h2>
          <p className="mt-2 text-sm text-muted">Wyślemy link do plików na twój e-mail. Przy okazji będziesz pierwszą osobą, która dowie się o nowych aktach i promocjach.</p>
          <div className="mt-5">
            <FreeCaseForm consentText={NEWSLETTER_CONSENT_TEXT} />
          </div>
        </div>
      </div>
    </section>
  );
}
