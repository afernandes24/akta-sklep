import Link from 'next/link';
import { getFollowupSettings, loadPromo } from '@/lib/followup';
import { getReferralCode, REFERRAL_FRIEND_PERCENT, REFERRAL_REWARD_GROSZE } from '@/lib/gifts';
import { formatPrice } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';
import { CopyCode } from './CopyCode';

type GiftInfo = { gift_kind: 'case' | 'card' | null; gift_to_email: string | null; gift_send_at: string | null; gift_sent_at: string | null; gift_card_code: string | null };

export async function getGiftInfo(orderId: string): Promise<GiftInfo | null> {
  const { data, error } = await createAdminClient()
    .from('orders')
    .select('gift_kind, gift_to_email, gift_send_at, gift_sent_at, gift_card_code')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !data?.gift_kind) return null;
  return data as GiftInfo;
}

const day = (d: string) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' }).format(new Date(d));

/** Prezent: kiedy wyjdzie / czy wyszedł. */
export function GiftStatus({ gift }: { gift: GiftInfo }) {
  return (
    <div className="card border-brass-400/40 p-6">
      <p className="eyebrow">🎁 Prezent</p>
      {gift.gift_sent_at ? (
        <p className="mt-2 text-paper-100">
          Prezent został wysłany na <strong>{gift.gift_to_email}</strong> ({day(gift.gift_sent_at)}).
        </p>
      ) : (
        <p className="mt-2 text-paper-100">
          Wyślemy go na <strong>{gift.gift_to_email}</strong>{' '}
          {gift.gift_send_at && new Date(gift.gift_send_at) > new Date() ? (
            <>
              <strong>{day(gift.gift_send_at)}</strong> rano
            </>
          ) : (
            'za chwilę'
          )}
          . Dostaniesz maila, gdy prezent wyjdzie.
        </p>
      )}
    </div>
  );
}

/** Po zakupie: kod polecający (znajomy −20%, ty 20 zł) i kod na kolejną sprawę. */
export async function PostPurchase({ email, isGift }: { email: string; isGift?: boolean }) {
  const [referral, settings] = await Promise.all([isGift ? Promise.resolve(null) : getReferralCode(email).catch(() => null), getFollowupSettings().catch(() => null)]);
  const promo = settings?.code ? await loadPromo(settings.code).catch(() => null) : null;
  if (!referral && !promo) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {referral && (
        <div className="card p-6">
          <p className="eyebrow">Poleć znajomym</p>
          <h3 className="mt-1 text-xl font-bold">Oni −{REFERRAL_FRIEND_PERCENT}%, ty {formatPrice(REFERRAL_REWARD_GROSZE)}</h3>
          <p className="mt-2 text-sm text-paper-200">
            Daj ten kod komuś, kto lubi kryminały. Dostanie −{REFERRAL_FRIEND_PERCENT}% na zakup, a ty — po jego zakupie — {formatPrice(REFERRAL_REWARD_GROSZE)} na kolejną
            sprawę. Za każdego znajomego.
          </p>
          <CopyCode code={referral} share={`Rozwiązuję sprawy kryminalne z Akt Detektywa — z moim kodem ${referral} masz −${REFERRAL_FRIEND_PERCENT}%: https://aktadetektywa.pl/sprawy?kod=${referral}`} />
        </div>
      )}
      {promo && (
        <div className="card p-6">
          <p className="eyebrow">Na kolejne śledztwo</p>
          <h3 className="mt-1 text-xl font-bold">{promo.label.charAt(0).toUpperCase() + promo.label.slice(1)} na następną sprawę</h3>
          <p className="mt-2 text-sm text-paper-200">Kod dla ciebie na kolejny zakup{promo.until ? `, ważny do ${promo.until}` : ''}.</p>
          <CopyCode code={promo.code} />
          <Link href={`/sprawy?kod=${promo.code}`} className="btn-secondary mt-3 w-full">
            Wybierz kolejną sprawę
          </Link>
        </div>
      )}
    </div>
  );
}
