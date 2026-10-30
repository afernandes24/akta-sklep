import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseCardMini } from '@/components/case/CaseCardMini';
import { GuideLayout, GuideSection, guideLink } from '@/components/guides/GuideLayout';
import { getPublishedCases } from '@/lib/cases';
import { formatPrice } from '@/lib/format';
import { getCaseRatings } from '@/lib/reviews';

export const revalidate = 3600;
const PATH = '/gra-kryminalna-online';

export const metadata: Metadata = {
  title: { absolute: 'Gra kryminalna online – rozwiąż sprawę bez drukowania' },
  description: 'Gra kryminalna online: te same akta co w PDF, czytane w przeglądarce na komputerze lub telefonie. Notatki na koncie, rozwiązanie w zapieczętowanej kopercie.',
  alternates: { canonical: PATH },
};

export default async function OnlineGamePage() {
  const [cases, ratings] = await Promise.all([getPublishedCases(), getCaseRatings()]);
  const online = cases.filter((c) => c.online_enabled);

  return (
    <GuideLayout
      path={PATH}
      crumb="Gra kryminalna online"
      eyebrow="Bez drukarki"
      title="Gra kryminalna online"
      intro={
        <p>
          Nie masz drukarki albo wolisz grać na ekranie? Wybrane sprawy kupisz jako grę kryminalną online — to te same akta co w wersji do druku, tylko
          czytane w przeglądarce na komputerze, tablecie lub telefonie.
        </p>
      }
    >
      <GuideSection title="Jak działa wersja online?">
        <p>
          Po zakupie sprawa pojawia się na twoim koncie w zakładce „Moje sprawy”. Otwierasz akta w przeglądarce i przeglądasz dokumenty jeden po drugim:
          raporty, protokoły przesłuchań, zdjęcia i dowody. Notatki zapisują się na koncie, więc możesz przerwać i wrócić do śledztwa później — także na
          innym urządzeniu. Rozwiązanie czeka w zapieczętowanej kopercie, którą otwierasz dopiero wtedy, gdy masz swoją teorię.
        </p>
        <p>
          Do wersji online potrzebne jest konto (zakładasz je w minutę) i dostęp do internetu. Jeśli sprawa ma nagrania z przesłuchań, odsłuchasz je w tej
          samej przeglądarce.
        </p>
      </GuideSection>

      <GuideSection title="PDF czy online — czym się różnią?">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="font-mono text-[11px] uppercase tracking-widest text-muted">
              <tr>
                <th className="py-2 pr-4 font-normal" />
                <th className="py-2 pr-4 font-normal">PDF do druku</th>
                <th className="py-2 font-normal">Online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {[
                ['Gdzie grasz', 'przy stole, na wydrukach', 'w przeglądarce, na ekranie'],
                ['Drukarka', 'potrzebna (A4)', 'niepotrzebna'],
                ['Internet w trakcie gry', 'nie (poza nagraniami)', 'tak'],
                ['Notatki', 'na papierze', 'zapisywane na koncie'],
                ['Konto', 'niewymagane', 'wymagane'],
              ].map(([k, a, b]) => (
                <tr key={k}>
                  <td className="py-2 pr-4 text-paper-50">{k}</td>
                  <td className="py-2 pr-4">{a}</td>
                  <td className="py-2">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Wersja PDF i online to osobne zakupy — wybierasz je na stronie sprawy.</p>
      </GuideSection>

      <GuideSection title="Sprawy dostępne online">
        {online.length > 0 ? (
          <>
            <ul className="space-y-1">
              {online.map((c) => (
                <li key={c.id}>
                  <Link href={`/sprawy/${c.slug}`} className={guideLink}>
                    AKTA #{c.case_number} — {c.title}
                  </Link>{' '}
                  — online {formatPrice(c.online_price_grosze ?? c.price_grosze)}, PDF {formatPrice(c.price_grosze)}
                </li>
              ))}
            </ul>
            <div className="grid gap-5 sm:grid-cols-2">
              {online.map((c) => (
                <CaseCardMini key={c.id} c={c} rating={ratings[c.id]} />
              ))}
            </div>
          </>
        ) : (
          <p>
            Wersje online kolejnych spraw są w przygotowaniu. Na razie wszystkie sprawy dostępne są jako{' '}
            <Link href="/sprawy" className={guideLink}>
              PDF do druku
            </Link>
            .
          </p>
        )}
      </GuideSection>

      <GuideSection title="Wolisz papier?">
        <p>
          Wiele osób najbardziej lubi rozłożyć akta na stole, podkreślać i przypinać dowody jak prawdziwy detektyw. Wtedy wybierz wersję do druku —
          wszystkie{' '}
          <Link href="/sprawy" className={guideLink}>
            sprawy kryminalne
          </Link>{' '}
          są dostępne w PDF, a na start możesz pobrać{' '}
          <Link href="/darmowa-sprawa" className={guideLink}>
            darmową sprawę
          </Link>
          .
        </p>
      </GuideSection>
    </GuideLayout>
  );
}
