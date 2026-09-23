import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/lib/config';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Masz pytanie o sprawę, płatność lub pobieranie plików? Napisz do nas.',
  alternates: { canonical: '/kontakt' },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Zgłoszenie" title="Kontakt">
        Pytanie o sprawę, problem z pobieraniem, faktura? Odpowiadamy zwykle w ciągu 1–2 dni roboczych.
      </PageHeader>
      <section className="container-page grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="card p-6 sm:p-8">
          <ContactForm />
        </div>
        <aside className="space-y-6 text-sm text-paper-200">
          {siteConfig.contactEmail && (
            <div className="card p-6">
              <h2 className="eyebrow">E-mail</h2>
              <a href={`mailto:${siteConfig.contactEmail}`} className="mt-2 block text-base text-brass-300 hover:underline">
                {siteConfig.contactEmail}
              </a>
            </div>
          )}
          <div className="card p-6">
            <h2 className="eyebrow">Zanim napiszesz</h2>
            <p className="mt-2 leading-relaxed">
              Odpowiedzi na najczęstsze pytania (pobieranie, druk, zwroty) znajdziesz w{' '}
              <Link href="/faq" className="text-brass-300 hover:underline">
                FAQ
              </Link>
              . Jeśli piszesz w sprawie zamówienia — podaj jego numer.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
