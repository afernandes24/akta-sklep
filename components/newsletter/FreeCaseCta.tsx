import Link from 'next/link';
import { CaseCover } from '@/components/case/CaseCover';
import { FREE_CASE, NEWSLETTER_CONSENT_TEXT } from '@/lib/newsletter';
import { FreeCaseForm } from './FreeCaseForm';

/** Blok „darmowa sprawa za zapis” — strona główna i katalog. */
export function FreeCaseCta({ source }: { source: string }) {
  return (
    <section className="card grid items-center gap-8 overflow-hidden p-6 sm:p-10 md:grid-cols-[220px_1fr]">
      <div className="mx-auto w-44 -rotate-3 md:w-full">
        <CaseCover caseNumber={FREE_CASE.number} title={FREE_CASE.title} />
      </div>
      <div>
        <p className="eyebrow">Darmowa sprawa próbna</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Sprawdź, czy masz nosa do śledztw</h2>
        <p className="mt-3 max-w-xl text-paper-200">
          {FREE_CASE.teaser} Zapisz się do newslettera, a wyślemy ci
          komplet plików PDF — za darmo.{' '}
          <Link href="/darmowa-sprawa" className="text-brass-300 underline underline-offset-2">
            Więcej o sprawie
          </Link>
        </p>
        <div className="mt-6 max-w-xl">
          <FreeCaseForm source={source} consentText={NEWSLETTER_CONSENT_TEXT} compact />
        </div>
      </div>
    </section>
  );
}
