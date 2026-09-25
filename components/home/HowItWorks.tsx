const steps = [
  { icon: '🕵️', title: 'Wybierz sprawę', text: 'Każda sprawa to zamknięta historia z własnymi podejrzanymi i tajemnicą.' },
  { icon: '💳', title: 'Kup i pobierz akta', text: 'Po płatności pliki PDF od razu czekają na twoim koncie.' },
  { icon: '🖨️', title: 'Wydrukuj materiały', text: 'Zwykła drukarka i papier A4 wystarczą. Rozłóż akta na stole.' },
  { icon: '🔎', title: 'Prowadź śledztwo', text: 'Czytaj raporty, porównuj zeznania, szukaj sprzeczności.' },
  { icon: '🧩', title: 'Rozwiązuj cele', text: 'Idź cel po celu, nie czytaj do przodu. Szyfry i łamigłówki odsłaniają kolejne tropy.' },
  { icon: '🧠', title: 'Znajdź winnego', text: 'Połącz fakty: kto, dlaczego, jak — i jakie dowody to potwierdzają.' },
  { icon: '🔐', title: 'Sprawdź odpowiedzi', text: 'Po każdym celu sprawdź odpowiedź w osobnym pliku. Nazwisko zabójcy czeka na ostatnich stronach.' },
];

export function HowItWorks() {
  return (
    <section id="jak-to-dziala" className="container-page scroll-mt-20 py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Procedura śledcza</p>
        <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Jak to działa?</h2>
        <p className="mt-4 text-lg text-paper-200">Siedem kroków od wyboru sprawy do wskazania winnego — na papierze przy stole albo w przeglądarce.</p>
      </div>
      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className={`card relative p-6 ${i === steps.length - 1 ? 'border-brass-500/40 sm:col-span-2 lg:col-span-1' : ''}`}>
            <span className="absolute right-5 top-5 font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
            <span aria-hidden className="text-3xl">
              {s.icon}
            </span>
            <h3 className="mt-4 font-serif text-xl font-semibold">
              {i + 1}. {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
