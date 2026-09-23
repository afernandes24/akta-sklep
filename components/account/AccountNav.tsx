import Link from 'next/link';
import { signOut } from '@/app/auth/actions';

export function AccountNav({ active, isAdmin }: { active: 'konto' | 'sprawy'; isAdmin?: boolean }) {
  const tab = (key: 'konto' | 'sprawy', href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={`rounded-md px-4 py-2 text-sm transition ${active === key ? 'bg-ink-800 text-paper-50' : 'text-paper-200 hover:text-brass-300'}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 pb-4">
      {tab('sprawy', '/konto/sprawy', 'Moje sprawy')}
      {tab('konto', '/konto', 'Konto i zamówienia')}
      {isAdmin && (
        <Link href="/admin" className="rounded-md px-4 py-2 text-sm text-brass-300 hover:underline">
          Panel admina
        </Link>
      )}
      <form action={signOut} className="ml-auto">
        <button className="btn-ghost text-sm">Wyloguj się</button>
      </form>
    </div>
  );
}
