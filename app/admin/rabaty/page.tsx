import { formatDate, formatPrice } from '@/lib/format';
import { VOLUME_TIERS } from '@/lib/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { toggleDiscountCode } from '../extra-actions';
import { DiscountCodeForm } from './DiscountCodeForm';
import { requireAdmin } from '@/lib/auth';

type Code = {
  code: string;
  percent_off: number | null;
  amount_off_grosze: number | null;
  second_percent_off?: number | null;
  min_items: number;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
  one_per_user: boolean;
  is_active: boolean;
  note: string | null;
};

export default async function AdminDiscountsPage() {
  await requireAdmin(); // każda strona panelu sprawdza uprawnienia sama (layout nie zawsze się wykonuje)
  const { data, error } = await createAdminClient().from('discount_codes').select('*').order('created_at', { ascending: false });
  const codes = (data ?? []) as Code[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Rabaty</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Rabat ilościowy działa automatycznie: {VOLUME_TIERS.map((t) => `od ${t.minItems} spraw −${t.percent}%`).reverse().join(', ')} (zmiana w{' '}
          <code className="font-mono">lib/pricing.ts</code>, pakiety w <code className="font-mono">lib/bundles.ts</code>). Kody rabatowe nie łączą się z
          rabatem ilościowym — klient zawsze dostaje korzystniejszy.
        </p>
      </div>

      <DiscountCodeForm />

      {error && <p className="text-sm text-stamp-500">Błąd: {error.message} — czy uruchomiono aktualny supabase/schema.sql?</p>}
      <div className="card overflow-x-auto">
        <table className="table-admin min-w-[760px]">
          <thead>
            <tr>
              <th>Kod</th>
              <th>Rabat</th>
              <th>Warunki</th>
              <th>Użycia</th>
              <th>Ważny do</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code} className={c.is_active ? '' : 'opacity-50'}>
                <td>
                  <span className="font-mono font-bold text-brass-300">{c.code}</span>
                  {c.note && <span className="block text-xs text-muted">{c.note}</span>}
                </td>
                <td>{c.second_percent_off ? `druga sprawa −${c.second_percent_off}%` : c.percent_off ? `−${c.percent_off}%` : `−${formatPrice(c.amount_off_grosze ?? 0)}`}</td>
                <td className="text-xs text-paper-200">
                  od {c.min_items} {c.min_items === 1 ? 'sprawy' : 'spraw'}
                  {c.one_per_user ? ' · 1× na klienta' : ''}
                </td>
                <td>
                  {c.used_count}
                  {c.max_uses ? ` / ${c.max_uses}` : ''}
                </td>
                <td className="text-xs text-muted">{c.valid_until ? formatDate(c.valid_until) : 'bezterminowo'}</td>
                <td>
                  <form action={toggleDiscountCode}>
                    <input type="hidden" name="code" value={c.code} />
                    <input type="hidden" name="active" value={String(!c.is_active)} />
                    <button className="btn-ghost py-1 text-xs">{c.is_active ? 'Wyłącz' : 'Włącz'}</button>
                  </form>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  Brak kodów. Dodaj pierwszy, np. POWITANIE10 dla subskrybentów newslettera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
