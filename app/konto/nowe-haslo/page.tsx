import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { NewPasswordForm } from '@/components/auth/AuthForms';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Ustaw nowe hasło', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function NewPasswordPage() {
  await requireUser('/konto/nowe-haslo');
  return (
    <AuthCard
      title="Ustaw nowe hasło"
      footer={
        <Link href="/konto" className="text-brass-300 hover:underline">
          Przejdź do konta →
        </Link>
      }
    >
      <NewPasswordForm />
    </AuthCard>
  );
}
