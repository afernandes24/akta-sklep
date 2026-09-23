import type { Metadata } from 'next';
import Link from 'next/link';
import { Notice } from '@/components/ui/PageHeader';
import { requireAdmin } from '@/lib/auth';
import { isServiceRoleConfigured } from '@/lib/config';
import { getPaymentProvider, getPaymentProviderId } from '@/lib/payments';

export const metadata: Metadata = { title: 'Panel admina', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const nav = [
  ['/admin', 'Pulpit'],
  ['/admin/sprawy', 'Sprawy'],
  ['/admin/zamowienia', 'Zamówienia'],
  ['/admin/uzytkownicy', 'Użytkownicy'],
  ['/admin/opinie', 'Opinie'],
  ['/admin/rabaty', 'Rabaty'],
  ['/admin/newsletter', 'Newsletter'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const providerId = getPaymentProviderId();
  const provider = getPaymentProvider();

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-4 border-b border-ink-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Panel administratora</p>
          <nav className="mt-2 flex flex-wrap gap-1" aria-label="Panel admina">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm text-paper-200 hover:bg-ink-800 hover:text-paper-50">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="font-mono text-xs text-muted">
          Płatności: <span className={provider ? 'text-emerald-300' : 'text-stamp-500'}>{providerId}</span>
          {provider ? '' : ' (nieskonfigurowane)'}
        </p>
      </div>
      {!isServiceRoleConfigured() && (
        <div className="mt-6">
          <Notice tone="error">Brak SUPABASE_SERVICE_ROLE_KEY — panel nie zapisze zmian. Uzupełnij zmienne środowiskowe.</Notice>
        </div>
      )}
      {providerId === 'mock' && provider && (
        <div className="mt-6">
          <Notice tone="warning">
            Sklep działa w <strong>trybie testowym płatności</strong> — klienci mogą „kupić” sprawę bez płacenia. Przed startem ustaw PAYMENT_PROVIDER na stripe
            lub przelewy24.
          </Notice>
        </div>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}
