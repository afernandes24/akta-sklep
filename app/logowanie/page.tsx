import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/AuthForms';
import { Notice } from '@/components/ui/PageHeader';
import { safeNext } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Logowanie', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; blad?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return (
    <AuthCard
      title="Zaloguj się"
      subtitle="Twoje zakupione sprawy czekają na koncie."
      footer={
        <>
          Nie masz konta?{' '}
          <Link href={`/rejestracja?next=${encodeURIComponent(next)}`} className="text-brass-300 hover:underline">
            Załóż je w minutę
          </Link>
        </>
      }
    >
      {sp.blad === 'link' && (
        <div className="mb-5">
          <Notice tone="error">Link wygasł lub jest nieprawidłowy. Spróbuj ponownie.</Notice>
        </div>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
