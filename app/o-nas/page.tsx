import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'O nas – twórcy gier kryminalnych z Gdyni',
  description: 'Mały zespół z Gdyni, który tworzy fabularne gry detektywistyczne do druku: realistyczne akta, logiczne zagadki i jedno uczciwe rozwiązanie.',
  alternates: { canonical: '/o-nas' },
};

/** Karta „akt osobowych” zespołu — w stylu dokumentów ze spraw. */
const dossier: [string, string][] = [
  ['Podmiot', 'Zespół Akt Detektywa'],
  ['Siedziba', 'Gdynia'],
  ['Znaki szczególne', 'Słabość do zagadek kryminalnych, starych spraw i alibi, które nie trzymają się kupy.'],
  ['Metoda działania', 'Każdą sprawę piszemy sami i sami rozwiązujemy ją od pierwszego raportu do ostatniej strony odpowiedzi. Dopiero gdy wszystko się zgadza, akta trafiają do archiwum.'],
  ['Współpracownik', 'Sztuczna inteligencja. Rysuje portrety podejrzanych i ilustracje do akt oraz pomaga przy tekstach. Logikę każdej sprawy sprawdzamy sami.'],
  ['Status', 'Śledztwo w toku. Kolejne akta w przygotowaniu.'],
];

const principles = [
  ['Historia na pierwszym miejscu', 'Każda zagadka wynika z fabuły. Nie rozwiązujesz łamigłówek — prowadzisz śledztwo, w którym każde odkrycie popycha sprawę do przodu.'],
  ['Uczciwa logika', 'Wszystko, czego potrzebujesz, jest w aktach. Fałszywe tropy są logiczne, a rozwiązanie jest jedno i da się do niego dojść bez zgadywania.'],
  ['Realistyczne akta', 'Raporty, protokoły, wiadomości, zdjęcia i pieczęcie wyglądają jak prawdziwe dokumenty — profesjonalnie, bez horrorowej przesady.'],
  ['Papier albo ekran', 'Drukujesz akta i rozkładasz je na stole — możesz je przekładać, podkreślać i przypinać jak prawdziwy detektyw. Wolisz bez drukowania? Wybrane sprawy mają wersję online.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="O nas" title="Twórcy gier detektywistycznych z Gdyni">
        Jesteśmy małym zespołem z Gdyni i tworzymy fabularne sprawy detektywistyczne do samodzielnego wydrukowania. Chcemy, żebyś po odłożeniu ostatniej
        kartki miał poczucie, że to ty rozwiązałeś sprawę — nie gra.
      </PageHeader>
      <section className="container-page">
        <article className="paper relative mb-12 overflow-hidden rounded-xl p-6 sm:p-10" aria-labelledby="akta-zespolu">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-900/20 pb-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-600">Akta osobowe · nr 000</p>
              <h2 id="akta-zespolu" className="mt-2 font-serif text-2xl font-semibold text-ink-900 sm:text-3xl">
                Kto stoi za aktami
              </h2>
            </div>
            <span className="stamp text-sm">Ściśle jawne</span>
          </div>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-[11rem_1fr]">
            {dossier.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-mono text-xs uppercase tracking-[0.18em] text-ink-600 sm:pt-1">{label}</dt>
                <dd className="-mt-4 leading-relaxed text-ink-900 sm:mt-0">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
        <div className="grid gap-6 md:grid-cols-2">
          {principles.map(([title, text]) => (
            <div key={title} className="card p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">{title}</h2>
              <p className="mt-3 leading-relaxed text-paper-200">{text}</p>
            </div>
          ))}
        </div>
        <div className="paper mt-12 rounded-xl p-8 sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-600">Nasza zasada</p>
          <p className="mt-3 font-serif text-2xl leading-snug text-ink-900 sm:text-3xl">
            „Po zamknięciu akt musisz umieć odpowiedzieć: kto, dlaczego, jak — i które dowody to potwierdzają.”
          </p>
        </div>
        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link href="/sprawy" className="btn-primary">
            Zobacz sprawy
          </Link>
          <Link href="/kontakt" className="btn-secondary">
            Skontaktuj się z nami
          </Link>
        </div>
      </section>
    </>
  );
}
