import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { campaignHtml, getSubscribers, loadCases } from '@/lib/campaign';
import { followupHtml, getBuyers, getFollowupSettings, loadPromo, recommendationsFor } from '@/lib/followup';
import { isAdminUser } from '@/lib/online';
import { getWeeklySettings, loadWeeklyCases, weekKey, weeklyHtml, weeklyPromo } from '@/lib/weekly';

export const dynamic = 'force-dynamic';

/** Podgląd maila wysłanego do konkretnej osoby (tylko admin). ?typ=zakup|newsletter&e=adres[&kod=…] */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user || !(await isAdminUser(user.id))) return new NextResponse('Nie znaleziono', { status: 404 });
  const sp = new URL(req.url).searchParams;
  const email = String(sp.get('e') ?? '').toLowerCase();
  const cases = await loadCases();
  let html = '<p>Brak danych.</p>';
  if (sp.get('typ') === 'tydzien') {
    const w = /^TYDZIEN-\d{4}-\d{2}$/.test(sp.get('w') ?? '') ? sp.get('w')! : weekKey();
    const promo = await weeklyPromo(w, await getWeeklySettings(), false);
    const sub = (await getSubscribers()).find((s) => s.email.toLowerCase() === email) ?? { email, token: 'podglad' };
    html = weeklyHtml(sub, w, await loadWeeklyCases(), promo)?.html ?? html;
  } else if (sp.get('typ') === 'newsletter') {
    const promo = await loadPromo(sp.get('kod') || 'DRUGAGRATIS');
    const sub = (await getSubscribers()).find((s) => s.email.toLowerCase() === email) ?? { email, token: 'podglad' };
    if (promo) html = campaignHtml(sub, promo, cases).html;
  } else {
    const b = (await getBuyers()).buyers.find((x) => x.email === email);
    const promo = await loadPromo(sp.get('kod') || (await getFollowupSettings()).code);
    if (b) html = followupHtml(b, promo, recommendationsFor(b, cases)).html;
  }
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
