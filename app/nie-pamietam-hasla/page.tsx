import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetRequestForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Nie pamiętam hasła', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Nowe hasło"
      subtitle="Podaj e-mail, a wyślemy ci link do ustawienia nowego hasła."
      footer={
        <Link href="/logowanie" className="text-brass-300 hover:underline">
          ← Wróć do logowania
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthCard>
  );
}
