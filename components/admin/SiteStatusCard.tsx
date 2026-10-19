import { setSiteOpen } from '@/app/admin/extra-actions';

/** Status sklepu: jeden włącznik ON / OFF. */
export function SiteStatusCard({ isOpen, missingTable }: { isOpen: boolean; missingTable: boolean }) {
  return (
    <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <h2 className="font-serif text-xl font-semibold">Status sklepu</h2>
        <p className={`mt-1 text-sm ${isOpen ? 'text-emerald-300' : 'text-brass-300'}`}>{isOpen ? 'Sklep włączony' : 'Sklep wyłączony'}</p>
        {missingTable && <p className="mt-2 text-sm text-stamp-500">Brak tabeli ustawień — uruchom supabase/schema.sql w Supabase.</p>}
      </div>
      <form action={setSiteOpen}>
        <input type="hidden" name="open" value={isOpen ? 'false' : 'true'} />
        <button
          role="switch"
          aria-checked={isOpen}
          aria-label={isOpen ? 'Wyłącz sklep' : 'Włącz sklep'}
          disabled={missingTable}
          className={`relative inline-flex h-10 w-[104px] items-center rounded-full border transition-colors ${isOpen ? 'border-emerald-500 bg-emerald-600/80' : 'border-ink-600 bg-ink-800'}`}
        >
          <span className={`absolute font-mono text-xs font-bold ${isOpen ? 'left-4 text-white' : 'right-4 text-muted'}`}>{isOpen ? 'ON' : 'OFF'}</span>
          <span className={`absolute h-8 w-8 rounded-full bg-paper-50 shadow transition-all ${isOpen ? 'left-[66px]' : 'left-1'}`} />
        </button>
      </form>
    </section>
  );
}
