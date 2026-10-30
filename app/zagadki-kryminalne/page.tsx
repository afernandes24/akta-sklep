import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideLayout, GuideSection, guideLink } from '@/components/guides/GuideLayout';

const PATH = '/zagadki-kryminalne';

export const metadata: Metadata = {
  title: { absolute: 'Zagadki kryminalne do rozwiązania (z odpowiedziami)' },
  description: 'Cztery krótkie zagadki kryminalne do rozwiązania w kilka minut — z odpowiedziami. Sprawdź swoją dedukcję, a potem zmierz się z pełną sprawą do druku.',
  alternates: { canonical: PATH },
};

const PUZZLES: { title: string; story: React.ReactNode; answer: React.ReactNode }[] = [
  {
    title: 'Zagadka 1: Jedna prawdomówna osoba',
    story: (
      <>
        Z biura zniknęła koperta z gotówką. W pokoju byli tylko Adam, Beata i Cezary. Adam mówi: „Zrobiła to Beata”. Beata: „Nie zrobiłam tego”.
        Cezary: „Ja tego nie zrobiłem”. Wiadomo, że dokładnie jedna z tych osób mówi prawdę. Kto zabrał kopertę?
      </>
    ),
    answer: (
      <>
        <strong>Cezary.</strong> Gdyby winny był Adam, prawdę mówiliby Beata i Cezary — dwie osoby. Gdyby winna była Beata, prawdę mówiliby Adam i Cezary — też
        dwie. Tylko gdy winny jest Cezary, prawdę mówi wyłącznie Beata.
      </>
    ),
  },
  {
    title: 'Zagadka 2: Lód w szklance',
    story: (
      <>
        Gospodarz zostaje znaleziony nieprzytomny o 23:30. Jego wspólnik zeznaje: „Wyszedłem o 22:00. Nalał sobie wtedy whisky z lodem i od tej pory nikt
        do niego nie przychodził”. W pokoju jest ciepło, 24°C. Na stole stoi szklanka pełna nieroztopionych kostek lodu. Co nie gra w tym zeznaniu?
      </>
    ),
    answer: (
      <>
        <strong>Lód.</strong> W ciepłym pokoju kostki rozpuściłyby się w półtorej godziny. Drink nalano niedawno — więc albo ktoś był u gospodarza po
        22:00, albo wspólnik wyszedł znacznie później, niż twierdzi.
      </>
    ),
  },
  {
    title: 'Zagadka 3: Ślady na śniegu',
    story: (
      <>
        Śnieg przestał padać o 2:00 w nocy. Rano właściciel domu na odludziu zostaje znaleziony martwy — lekarz ocenia, że zmarł między 3:00 a 4:00.
        Nocujący u niego gość twierdzi, że w nocy słyszał, jak ktoś obcy wchodzi do domu. Na świeżym śniegu wokół domu są tylko ślady listonosza: do
        skrzynki przy furtce i z powrotem. Komu nie wierzysz?
      </>
    ),
    answer: (
      <>
        <strong>Gościowi.</strong> Po 2:00 nikt nie mógł dojść do domu, nie zostawiając śladów na świeżym śniegu, a jedyne ślady kończą się przy furtce.
        Skoro do śmierci doszło po 3:00, sprawca był już w środku — a „obcy” został wymyślony.
      </>
    ),
  },
  {
    title: 'Zagadka 4: Pamiętny piątek',
    story: (
      <>
        Podejrzany podaje alibi: „W piątek trzynastego byłem cały wieczór na urodzinach brata. Dobrze pamiętam tę datę, bo to był ostatni dzień miesiąca
        i rano przyszła wypłata”. Dlaczego śledczy od razu notuje: „alibi do sprawdzenia”?
      </>
    ),
    answer: (
      <>
        <strong>Bo trzynasty nie może być ostatnim dniem miesiąca.</strong> Najkrótszy miesiąc ma 28 dni. Ktoś, kto naprawdę pamięta ten wieczór, nie
        pomyliłby tak charakterystycznej daty — zeznanie jest zmyślone albo przeniesione z innego dnia.
      </>
    ),
  },
];

const FAQ: [string, string][] = [
  ['Czy te zagadki są trudne?', 'Nie — to krótkie rozgrzewki na kilka minut. Pełne sprawy w sklepie mają kilkadziesiąt stron akt, kilku podejrzanych i kilka etapów śledztwa.'],
  ['Czy mogę wydrukować te zagadki?', 'Tak, do użytku prywatnego — na wieczór ze znajomymi, rodzinną zabawę czy rozgrzewkę przed większą sprawą.'],
  ['Gdzie znajdę dłuższe zagadki kryminalne?', 'W naszym katalogu spraw: każda to gra detektywistyczna do druku z aktami, przesłuchaniami, wskazówkami i odpowiedziami.'],
];

export default function CrimePuzzlesPage() {
  return (
    <GuideLayout
      path={PATH}
      crumb="Zagadki kryminalne"
      eyebrow="Rozgrzewka dla detektywów"
      title="Zagadki kryminalne do rozwiązania"
      intro={
        <p>
          Cztery krótkie zagadki kryminalne — każda na kilka minut, każda z jednym logicznym rozwiązaniem. Przeczytaj historię, poszukaj sprzeczności i
          dopiero wtedy odsłoń odpowiedź. Dobra zagadka kryminalna nie wymaga zgadywania: wszystko, czego potrzebujesz, jest w treści.
        </p>
      }
      extraJsonLd={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }}
    >
      <GuideSection title="Cztery zagadki z odpowiedziami">
        <div className="space-y-6">
          {PUZZLES.map((p) => (
            <div key={p.title} className="card p-5 sm:p-6">
              <h3 className="text-xl font-semibold">{p.title}</h3>
              <p className="mt-3">{p.story}</p>
              <details className="mt-4 rounded-md border border-ink-700 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-brass-300">Pokaż rozwiązanie</summary>
                <p className="mt-3">{p.answer}</p>
              </details>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection title="Jak rozwiązywać zagadki kryminalne?">
        <p>
          Większość zagadek opiera się na tych samych trikach co prawdziwe śledztwa. Szukaj sprzeczności między zeznaniem a faktami (pogoda, godziny, daty),
          sprawdzaj, kto mógł fizycznie być na miejscu, i zawsze pytaj, czy dana informacja coś wyklucza. Zapisuj, co wiesz na pewno, a co jest tylko czyjąś
          deklaracją — to rozróżnienie rozwiązuje połowę spraw.
        </p>
      </GuideSection>

      <GuideSection title="Chcesz czegoś większego? Pełna sprawa kryminalna do rozwiązania">
        <p>
          Krótka zagadka to rozgrzewka. Prawdziwą przyjemność daje sprawa, w której dowody trzeba złożyć z wielu dokumentów: raportów, protokołów
          przesłuchań, wiadomości z telefonów i nagrań. Takie właśnie są nasze{' '}
          <Link href="/sprawy" className={guideLink}>
            gry detektywistyczne do druku
          </Link>
          {' '}— od nocy na cmentarzu w{' '}
          <Link href="/sprawy/pusty-grob" className={guideLink}>
            „Pustym grobie”
          </Link>{' '}
          po kolację w całkowitej ciemności w{' '}
          <Link href="/sprawy/kolacja-w-ciemnosci" className={guideLink}>
            „Kolacji w ciemności”
          </Link>
          . Na początek możesz pobrać{' '}
          <Link href="/darmowa-sprawa" className={guideLink}>
            darmową sprawę
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection title="Najczęstsze pytania">
        <dl className="space-y-5">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold text-paper-50">{q}</dt>
              <dd className="mt-1">{a}</dd>
            </div>
          ))}
        </dl>
      </GuideSection>
    </GuideLayout>
  );
}
