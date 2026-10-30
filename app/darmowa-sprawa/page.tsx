import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseCover } from '@/components/case/CaseCover';
import { FreeCaseForm } from '@/components/newsletter/FreeCaseForm';
import { FREE_CASE, NEWSLETTER_CONSENT_TEXT } from '@/lib/newsletter';

export const metadata: Metadata = {
  title: 'Darmowa gra detektywistyczna PDF do druku',
  description: FREE_CASE.seoDescription,
  alternates: { canonical: '/darmowa-sprawa' },
};

const link = 'text-brass-300 underline-offset-4 hover:underline';
const FAQ: [string, React.ReactNode][] = [
  [
    'Czy to naprawdę za darmo?',
    'Tak. Podajesz tylko adres e-mail i potwierdzasz zapis do newslettera — link do plików przychodzi na skrzynkę. Z newslettera wypiszesz się jednym kliknięciem w każdej chwili, a pliki zostają u ciebie.',
  ],
  ['Ile trwa gra?', 'Tajemnica spowiedzi to krótsza sprawa na 45–60 minut. Pełne sprawy w sklepie zajmują zwykle od 1 do 3 godzin.'],
  ['Ile osób może grać?', 'Od 1 do 6 osób, od 16 lat. Możesz grać w pojedynkę, we dwoje albo w większym gronie — wystarczy jeden wydruk akt na stół.'],
];

export default function FreeCasePage() {
  return (
    <>
    <section className="container-page grid gap-12 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <div className="mx-auto w-full max-w-sm">
        <CaseCover caseNumber={FREE_CASE.number} title={FREE_CASE.title} coverPath={FREE_CASE.cover} size="lg" priority />
      </div>
      <div>
        <p className="eyebrow">Akta #{FREE_CASE.number} · za darmo</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
          <span className="block font-sans text-lg font-normal text-muted">Darmowa gra detektywistyczna:</span>
          {FREE_CASE.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-paper-200">
          {FREE_CASE.lead}
        </p>
        <ul className="mt-6 grid gap-2 text-paper-200 sm:grid-cols-2">
          {FREE_CASE.bullets.map((t) => (
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

    <section className="container-page max-w-3xl pb-8 text-paper-200">
      <h2 className="text-3xl font-bold">Co dostaniesz</h2>
      <p className="mt-4 leading-relaxed">
        Po potwierdzeniu zapisu dostajesz komplet plików PDF — ten sam układ co w płatnych sprawach, tylko krótsza historia:
      </p>
      <ul className="mt-4 space-y-2">
        {[
          ['Instrukcja', 'zasady gry, przygotowanie i opis zestawu na jednej stronie'],
          ['Akta sprawy', 'raporty, protokoły przesłuchań, zapiski ofiary i dowody podzielone na 3 cele'],
          ['Wskazówki', 'podpowiedzi do każdego celu, od najsłabszej do najmocniejszej'],
          ['Odpowiedzi', 'rozwiązania celów i zakończenie sprawy — otwierasz dopiero na końcu'],
        ].map(([t, d]) => (
          <li key={t} className="flex gap-2">
            <span aria-hidden className="text-brass-400">◆</span>
            <span>
              <strong className="text-paper-50">{t}</strong> — {d}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-3xl font-bold">Jak zagrać</h2>
      <ol className="mt-4 space-y-3">
        {[
          ['Pobierz pliki', 'kliknij link z e-maila i zapisz PDF-y na komputerze lub telefonie.'],
          ['Wydrukuj akta', 'zwykła drukarka A4 wystarczy — kolor wygląda lepiej, ale czarno-biały wydruk też działa.'],
          ['Rozwiązuj cele', 'czytaj dowody po kolei i odpowiadaj na pytania komisarz Anny Pawlak; gdy utkniesz, sięgnij po wskazówki.'],
          ['Wskaż winnego', 'na końcu sprawdź w odpowiedziach, czy twoja dedukcja trzyma się dowodów.'],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="font-mono text-brass-400">{i + 1}.</span>
            <span>
              <strong className="text-paper-50">{t}</strong> — {d}
            </span>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-3xl font-bold">Najczęstsze pytania</h2>
      <dl className="mt-4 space-y-5">
        {FAQ.map(([q, a]) => (
          <div key={q}>
            <dt className="font-semibold text-paper-50">{q}</dt>
            <dd className="mt-1 leading-relaxed">{a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10">
        Spodobało się? Zobacz{' '}
        <Link href="/sprawy" className={link}>
          pełne sprawy kryminalne do druku
        </Link>{' '}
        — dłuższe śledztwa, więcej podejrzanych i trudniejsze łamigłówki. Więcej odpowiedzi znajdziesz w{' '}
        <Link href="/faq" className={link}>
          FAQ
        </Link>
        .
      </p>
    </section>
    </>
  );
}
