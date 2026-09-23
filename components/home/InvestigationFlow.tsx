const flow = ['Wydarzenie', 'Tropienie', 'Odkrycie', 'Zagadka', 'Nowa informacja', 'Kolejne wydarzenie'];

export function InvestigationFlow() {
  return (
    <section className="border-y border-ink-800 bg-ink-900/60">
      <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">To nie jest zbiór łamigłówek</p>
          <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Prowadzisz prawdziwe śledztwo</h2>
          <div className="prose-akta mt-6 text-lg">
            <p>
              Podejrzany twierdzi, że wieczorem był w domu. Zauważasz sprzeczność w jego zeznaniu i postanawiasz sprawdzić biuro. W koszu na śmieci
              leży kartka z zaszyfrowaną wiadomością.
            </p>
            <p>
              Odszyfrowujesz ją — i dostajesz nazwisko, którego jeszcze nie było w aktach. <span className="text-paper-50">Historia rusza dalej.</span>
            </p>
            <p className="text-muted">Każda zagadka wynika z fabuły. Każde rozwiązanie otwiera kolejny etap sprawy.</p>
          </div>
        </div>
        <ol className="relative space-y-3" aria-label="Przebieg śledztwa">
          {flow.map((step, i) => (
            <li key={step} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brass-500/60 font-mono text-sm text-brass-300">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`flex-1 rounded-md border px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] ${i === 3 ? 'border-brass-500/60 bg-brass-500/10 text-brass-300' : 'border-ink-700 bg-ink-950 text-paper-100'}`}>
                {step}
              </span>
              {i < flow.length - 1 && <span aria-hidden className="hidden text-muted sm:inline">↓</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
