'use client';

import { EmailTypoHint } from '@/components/ui/EmailTypoHint';

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
const maxDay = () => new Date(Date.now() + 119 * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

/** Pola „dla kogo prezent” — koszyk i karta podarunkowa. Nazwy pól czyta lib/gift-form.ts. */
export function GiftFields({ idPrefix = 'gift' }: { idPrefix?: string }) {
  return (
    <div className="space-y-3 rounded-md border border-brass-400/30 bg-brass-400/5 p-4">
      <div>
        <label htmlFor={`${idPrefix}-email`} className="label">
          E-mail osoby obdarowanej
        </label>
        <input id={`${idPrefix}-email`} name="gift_to_email" type="email" required maxLength={200} className="input" placeholder="np. ania@gmail.com" />
        <EmailTypoHint inputId={`${idPrefix}-email`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Imię obdarowanego (opcjonalnie)</span>
          <input name="gift_to_name" maxLength={60} className="input" placeholder="Ania" />
        </label>
        <label className="block">
          <span className="label">Od kogo (podpis)</span>
          <input name="gift_from_name" maxLength={60} className="input" placeholder="Tomek" />
        </label>
      </div>
      <label className="block">
        <span className="label">Liścik (opcjonalnie)</span>
        <textarea name="gift_message" maxLength={400} rows={3} className="input" placeholder="Wszystkiego najlepszego, detektywie!" />
      </label>
      <label className="block">
        <span className="label">Kiedy wysłać</span>
        <input name="gift_date" type="date" min={today()} max={maxDay()} defaultValue={today()} className="input max-w-[200px]" />
        <span className="mt-1 block text-xs text-muted">Dzisiaj = zaraz po płatności. Inna data = tego dnia ok. 8:00.</span>
      </label>
    </div>
  );
}
