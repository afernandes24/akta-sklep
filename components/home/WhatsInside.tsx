const items = [
  { title: 'Protokoły przesłuchań', text: 'Pięć wersji tej samej nocy. Porównuj szczegóły i łap kłamstwa.' },
  { title: 'Raporty i dokumenty', text: 'Raporty policyjne, wyciągi, rachunki, grafiki zmian — jak w prawdziwych aktach.' },
  { title: 'Dowody i zdjęcia', text: 'Zdjęcia z miejsca zdarzenia, wiadomości z telefonu, notatki i kartki z kosza.' },
  { title: 'Szyfry i zagadki', text: 'Wynikają z historii i prowadzą do kolejnych miejsc lub osób.' },
  { title: 'Oś czasu', text: 'Notatnik detektywa z miejscem na chronologię, motywy i wnioski.' },
  { title: 'Zapieczętowane rozwiązanie', text: 'Osobny plik z pełnym wyjaśnieniem: kto, dlaczego, jak i na podstawie jakich dowodów.' },
];

export function WhatsInside() {
  return (
    <section className="container-page py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Zawartość teczki</p>
        <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Co znajdziesz w aktach?</h2>
      </div>
      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="bg-ink-900 p-6">
            <h3 className="font-serif text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
