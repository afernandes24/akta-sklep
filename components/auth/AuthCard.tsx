import { isSupabaseConfigured } from '@/lib/config';
import { Notice } from '../ui/PageHeader';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="container-page flex justify-center py-12 sm:py-20">
      <div className="w-full max-w-md">
        <p className="eyebrow text-center">Dostęp do akt</p>
        <h1 className="mt-2 text-center text-4xl font-bold">{title}</h1>
        {subtitle && <p className="mt-3 text-center text-paper-200">{subtitle}</p>}
        <div className="card mt-8 p-6 sm:p-8">
          {!isSupabaseConfigured() && (
            <div className="mb-5">
              <Notice tone="warning">Tryb podglądu: konta będą działać po podłączeniu Supabase (zobacz README).</Notice>
            </div>
          )}
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-paper-200">{footer}</div>}
      </div>
    </section>
  );
}
