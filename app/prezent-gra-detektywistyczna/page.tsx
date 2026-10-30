import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseCardMini } from '@/components/case/CaseCardMini';
import { GuideLayout, GuideSection, guideLink } from '@/components/guides/GuideLayout';
import { getPublishedCases } from '@/lib/cases';
import { formatPrice } from '@/lib/format';
import { maxPlayers, playTime } from '@/lib/guides';
import { VOLUME_TIERS } from '@/lib/pricing';
import { getCaseRatings } from '@/lib/reviews';
import { levelName } from '@/lib/tags';

export const revalidate = 3600;
const PATH = '/prezent-gra-detektywistyczna';

export const metadata: Metadata = {
  title: { absolute: 'Gra detektywistyczna na prezent – do druku od ręki' },
  description: 'Gra detektywistyczna na prezent: PDF od razu po płatności, do wydrukowania i zapakowania. Na Mikołajki, święta i urodziny — sprawdź, którą sprawę wybrać.',
  alternates: { canonical: PATH },
};

export default async function GiftPage() {
  const [cases, ratings] = await Promise.all([getPublishedCases(), getCaseRatings()]);
  const easy = cases.filter((c) => c.difficulty <= 3);
  const hard = cases.filter((c) => c.difficulty >= 4);
  const bigGroup = cases.filter((c) => (maxPlayers(c.highlights) ?? 0) >= 6);
  const cheapest = cases.length ? Math.min(...cases.map((c) => c.price_grosze)) : 0;

  return (
    <GuideLayout
      path={PATH}
      crumb="Gra na prezent"
      eyebrow="Pomysł na prezent"
      title="Gra detektywistyczna na prezent"
      intro={
        <p>
          Szukasz prezentu dla kogoś, kto kocha kryminały, seriale true crime albo escape roomy? Gra detektywistyczna do druku to prezent, który daje
          wieczór emocji zamiast kolejnego gadżetu — i dociera od razu, bez czekania na kuriera.
        </p>
      }
    >
      <GuideSection title="Dla kogo to dobry prezent?">
        <p>
          Dla par, które szukają pomysłu na wieczór we dwoje, dla paczki znajomych, która lubi planszówki, dla fanów kryminałów i dla każdego, kto lubi
          łamigłówki. Nasze sprawy są dla osób od 16 lat i działają zarówno w pojedynkę, jak i w grupie. To dobry pomysł na Mikołajki, prezent pod
          choinkę, urodziny czy walentynki.
        </p>
      </GuideSection>

      <GuideSection title="Dlaczego PDF to dobry prezent?">
        <ul className="space-y-2">
          {[
            ['Od ręki', 'pliki dostajesz zaraz po płatności — idealne na prezent last minute.'],
            ['Do zapakowania', 'wydrukuj akta, włóż je do szarej koperty albo teczki i wręcz jak prawdziwe dossier.'],
            ['Na wiele wieczorów', 'akta można wydrukować ponownie i zagrać z inną ekipą.'],
            ['Bez wysyłki', 'nie płacisz za dostawę i nie martwisz się, że paczka nie dojdzie na czas.'],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden className="text-brass-400">◆</span>
              <span>
                <strong className="text-paper-50">{t}</strong> — {d}
              </span>
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection title="Którą sprawę wybrać?">
        <p>
          Wszystkie sprawy mają jedno logiczne rozwiązanie oraz wskazówki na wypadek, gdyby obdarowany utknął. Różnią się trudnością, długością i liczbą
          graczy. {cheapest ? <>Ceny zaczynają się od {formatPrice(cheapest)}.</> : null}
        </p>
        {easy.length > 0 && (
          <>
            <h3 className="pt-2 text-xl font-semibold">Na początek — dla osób, które grają pierwszy raz</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {easy.map((c) => (
                <CaseCardMini key={c.id} c={c} rating={ratings[c.id]} />
              ))}
            </div>
          </>
        )}
        {hard.length > 0 && (
          <>
            <h3 className="pt-4 text-xl font-semibold">Dla wymagających — dla fanów kryminałów i escape roomów</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {hard.map((c) => (
                <CaseCardMini key={c.id} c={c} rating={ratings[c.id]} />
              ))}
            </div>
          </>
        )}
        {bigGroup.length > 0 && (
          <p>
            Prezent dla większej ekipy? Do 6 osób zagracie w:{' '}
            {bigGroup.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ', '}
                <Link href={`/sprawy/${c.slug}`} className={guideLink}>
                  {c.title}
                </Link>{' '}
                ({levelName(c.difficulty).toLowerCase()}, {playTime(c.play_time_minutes)})
              </span>
            ))}
            .
          </p>
        )}
      </GuideSection>

      <GuideSection title="Kilka spraw w zestawie taniej">
        <p>
          Chcesz podarować więcej niż jedną sprawę? Rabat liczy się sam w koszyku:{' '}
          {[...VOLUME_TIERS]
            .reverse()
            .map((t) => `${t.minItems === 2 ? '2 sprawy' : `${t.minItems} i więcej`} — ${t.percent}% taniej`)
            .join(', ')}
          . Nie wiesz, czy obdarowanemu się spodoba? Najpierw sprawdź naszą{' '}
          <Link href="/darmowa-sprawa" className={guideLink}>
            darmową sprawę
          </Link>{' '}
          albo przejrzyj{' '}
          <Link href="/faq" className={guideLink}>
            najczęstsze pytania
          </Link>
          .
        </p>
      </GuideSection>
    </GuideLayout>
  );
}
