import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountNav } from '@/components/account/AccountNav';
import { StatusBadge } from '@/components/account/StatusBadge';
import { getProfile, requireUser } from '@/lib/auth';
import { formatDate, formatPrice } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/lib/types';
import { ProfileForm } from './ProfileForm';

export const metadata: Metadata = { title: 'Moje konto', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireUser('/konto');
  const profile = await getProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, status, total_grosze, created_at, provider, order_items(id, title, price_grosze)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const orders = (data ?? []) as unknown as Order[];

  return (
    <section className="container-page py-12">
      <p className="eyebrow">Konto</p>
      <h1 className="mt-2 text-4xl font-bold">Dzień dobry{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
      <p className="mt-2 text-paper-200">{user.email}</p>

      <div className="mt-8">
        <AccountNav active="konto" isAdmin={profile?.is_admin} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-serif text-xl font-semibold">Dane konta</h2>
            <div className="mt-4">
              <ProfileForm fullName={profile?.full_name ?? ''} />
            </div>
            <Link href="/konto/nowe-haslo" className="mt-4 inline-block text-sm text-brass-300 hover:underline">
              Zmień hasło
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-xl font-semibold">Historia zamówień</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nie masz jeszcze zamówień.{' '}
              <Link href="/sprawy" className="text-brass-300 hover:underline">
                Wybierz pierwszą sprawę
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-800">
              {orders.map((o) => (
                <li key={o.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/zamowienie/${o.id}`} className="font-mono text-sm text-paper-50 hover:text-brass-300">
                      Zamówienie nr {o.order_number}
                    </Link>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatDate(o.created_at)}</p>
                  <ul className="mt-2 text-sm text-paper-200">
                    {(o.order_items ?? []).map((i) => (
                      <li key={i.id}>{i.title}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-sm font-semibold">{formatPrice(o.total_grosze)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
