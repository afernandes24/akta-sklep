import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/components/auth/AuthForms';
import { safeNext } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Załóż konto', robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthCard
      title="Załóż konto"
      subtitle="Konto przechowuje twoje sprawy — pobierzesz je ponownie w każdej chwili."
      footer={
        <>
          Masz już konto?{' '}
          <Link href={`/logowanie?next=${encodeURIComponent(next)}`} className="text-brass-300 hover:underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthCard>
  );
}
