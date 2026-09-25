const items = [
  { title: 'Protokoły przesłuchań', text: 'Każdy podejrzany ma swoją wersję. Porównuj szczegóły i łap kłamstwa — w części spraw także na nagraniach.' },
  { title: 'Raporty i dokumenty', text: 'Raporty policyjne, wyciągi, rachunki, grafiki zmian — jak w prawdziwych aktach.' },
  { title: 'Dowody i zdjęcia', text: 'Zdjęcia z miejsca zdarzenia, wiadomości z telefonu, notatki i kartki z kosza.' },
  { title: 'Szyfry i zagadki', text: 'Wynikają z historii i prowadzą do kolejnych miejsc lub osób.' },
  { title: 'Cele śledztwa', text: 'Sprawa podzielona na etapy. Każdy rozwiązany cel prowadzi do kolejnych dowodów — aż do winnego.' },
  { title: 'Wskazówki i odpowiedzi', text: 'Utknąłeś? Osobny plik ze wskazówkami do każdego celu. Odpowiedzi i pełne wyjaśnienie — zapieczętowane do końca.' },
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
