import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseCardMini } from '@/components/case/CaseCardMini';
import { GuideLayout, GuideSection, guideLink } from '@/components/guides/GuideLayout';
import { getPublishedCases } from '@/lib/cases';
import { getCaseRatings } from '@/lib/reviews';

export const revalidate = 3600;
const PATH = '/gra-detektywistyczna-dla-dwojga';

export const metadata: Metadata = {
  title: { absolute: 'Gra detektywistyczna dla dwojga – wieczór we dwoje' },
  description: 'Gra detektywistyczna dla dwojga na wieczór we dwoje: drukujecie akta, analizujecie dowody i razem wskazujecie winnego. Podpowiadamy, którą sprawę wybrać.',
  alternates: { canonical: PATH },
};

export default async function ForTwoPage() {
  const [cases, ratings] = await Promise.all([getPublishedCases(), getCaseRatings()]);
  // Na pierwszy wieczór: łatwiejsze i krótsze sprawy najpierw
  const sorted = [...cases].sort((a, b) => a.difficulty - b.difficulty || a.play_time_minutes - b.play_time_minutes);
  const first = sorted.filter((c) => c.difficulty <= 3).slice(0, 4);
  const harder = sorted.filter((c) => c.difficulty >= 4);

  return (
    <GuideLayout
      path={PATH}
      crumb="Gra dla dwojga"
      eyebrow="Wieczór we dwoje"
      title="Gra detektywistyczna dla dwojga"
      intro={
        <p>
          Masz dość kolejnego serialu? Gra detektywistyczna dla dwojga to pomysł na wieczór we dwoje, w którym to wy prowadzicie śledztwo: rozkładacie
          akta na stole, czytacie zeznania, porównujecie dowody i spieracie się o to, kto kłamie. Bez planszy, bez pudełka — wystarczy drukarka.
        </p>
      }
    >
      <GuideSection title="Dlaczego we dwoje gra się najlepiej?">
        <p>
          W parze każdy zauważa co innego: jedna osoba wyłapie sprzeczność w godzinach, druga — w drobnym szczególe na zdjęciu. Dzielicie się aktami,
          czytacie fragmenty na głos i budujecie wspólną teorię. Sprawa trwa zwykle od półtorej do trzech godzin, więc to pełny wieczór, a nie szybka
          partyjka. Wszystkie nasze sprawy można rozwiązać we dwoje — część z nich sprawdzi się też, gdy dołączą znajomi.
        </p>
      </GuideSection>

      <GuideSection title="Jak zorganizować wieczór z zagadką kryminalną?">
        <ol className="space-y-3">
          {[
            ['Wydrukujcie akta wcześniej', 'najlepiej w kolorze; trzymajcie strony po kolei według numerów.'],
            ['Przygotujcie stół', 'kartka i długopis, coś do picia, przyciemnione światło i — jeśli chcecie — kryminalna muzyka w tle.'],
            ['Grajcie etapami', 'każda sprawa ma kilka celów; po każdym sprawdzajcie odpowiedź, zanim przejdziecie dalej.'],
            ['Nie bójcie się wskazówek', 'są ułożone od najsłabszej do najmocniejszej, więc nie zdradzą za dużo naraz.'],
            ['Na koniec — werdykt', 'każde z was typuje sprawcę, a dopiero potem otwieracie zakończenie.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="font-mono text-brass-400">{i + 1}.</span>
              <span>
                <strong className="text-paper-50">{t}</strong> — {d}
              </span>
            </li>
          ))}
        </ol>
      </GuideSection>

      {first.length > 0 && (
        <GuideSection title="Które sprawy wybrać na pierwszy wieczór?">
          <p>Na początek polecamy sprawy o niższym poziomie trudności — są krótsze i łatwiej się w nie wciągnąć:</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {first.map((c) => (
              <CaseCardMini key={c.id} c={c} rating={ratings[c.id]} />
            ))}
          </div>
          {harder.length > 0 && (
            <p>
              Macie już za sobą kilka śledztw? Spróbujcie trudniejszych spraw:{' '}
              {harder.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ', '}
                  <Link href={`/sprawy/${c.slug}`} className={guideLink}>
                    {c.title}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}
        </GuideSection>
      )}

      <GuideSection title="Najpierw za darmo">
        <p>
          Nie wiecie, czy to coś dla was? Zacznijcie od{' '}
          <Link href="/darmowa-sprawa" className={guideLink}>
            darmowej sprawy
          </Link>{' '}
          na 45–60 minut. Jeśli się spodoba, w{' '}
          <Link href="/sprawy" className={guideLink}>
            katalogu spraw
          </Link>{' '}
          czekają dłuższe śledztwa — a przy zakupie dwóch spraw rabat nalicza się sam w koszyku.
        </p>
      </GuideSection>
    </GuideLayout>
  );
}
