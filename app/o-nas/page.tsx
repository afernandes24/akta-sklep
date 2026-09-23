import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'O nas',
  description: 'Tworzymy fabularne gry detektywistyczne do druku: realistyczne akta, logiczne zagadki i jedno uczciwe rozwiązanie.',
  alternates: { canonical: '/o-nas' },
};

const principles = [
  ['Historia na pierwszym miejscu', 'Każda zagadka wynika z fabuły. Nie rozwiązujesz łamigłówek — prowadzisz śledztwo, w którym każde odkrycie popycha sprawę do przodu.'],
  ['Uczciwa logika', 'Wszystko, czego potrzebujesz, jest w aktach. Fałszywe tropy są logiczne, a rozwiązanie jest jedno i da się do niego dojść bez zgadywania.'],
  ['Realistyczne akta', 'Raporty, protokoły, wiadomości, zdjęcia i pieczęcie wyglądają jak prawdziwe dokumenty — profesjonalnie, bez horrorowej przesady.'],
  ['Papier, nie ekran', 'Drukujesz materiały i rozkładasz je na stole. Możesz je przekładać, podkreślać i przypinać — jak prawdziwy detektyw.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="Kim jesteśmy" title="O nas">
        Tworzymy fabularne sprawy detektywistyczne do samodzielnego wydrukowania. Chcemy, żebyś po odłożeniu ostatniej kartki miał poczucie, że to ty rozwiązałeś
        sprawę — nie gra.
      </PageHeader>
      <section className="container-page">
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
