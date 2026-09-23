/** Dekoracyjna kompozycja akt na biurku (sam CSS, bez obrazków). */
export function HeroVisual() {
  return (
    <div aria-hidden className="relative mx-auto h-[380px] w-full max-w-md sm:h-[460px]">
      <div className="paper absolute left-2 top-8 w-[70%] -rotate-6 p-5 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600">Protokół przesłuchania</p>
        <p className="mt-1 font-mono text-sm font-bold uppercase">Podejrzany nr 3</p>
        <div className="mt-3 space-y-2">
          {[92, 80, 96, 70, 88, 60].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-ink-900/20" style={{ width: `${w}%` }} />
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-ink-800">— Byłem w domu. Całą noc.</p>
      </div>
      <div className="paper absolute right-0 top-24 w-[58%] rotate-3 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600">Dowód nr 7</p>
        <p className="mt-2 font-mono text-base font-bold tracking-[0.12em] text-ink-900">ZLQGD VHUZLVRZD 0:50</p>
        <p className="mt-2 font-mono text-[10px] text-ink-600">Znaleziono: kosz na śmieci, biuro</p>
        <span className="stamp mt-3 text-[10px]">Szyfr</span>
      </div>
      <div className="absolute bottom-6 left-10 w-[42%] -rotate-3 bg-paper-50 p-2 pb-6 shadow-2xl">
        <div className="aspect-[4/3]" style={{ background: 'radial-gradient(circle at 60% 35%, #8b8376 0 10%, transparent 11%), linear-gradient(160deg,#4a443b,#1b1916)' }} />
        <p className="mt-1 text-center font-mono text-[10px] text-ink-700">Pokój 512, 7:48</p>
      </div>
      <div className="absolute bottom-2 right-6 flex h-28 w-28 rotate-12 items-center justify-center rounded-full border-4 border-brass-400/70 shadow-2xl">
        <div className="h-20 w-20 rounded-full border-2 border-brass-400/40" />
        <div className="absolute -bottom-8 -right-4 h-14 w-4 rotate-[-45deg] rounded-full bg-brass-600/80" />
      </div>
    </div>
  );
}
