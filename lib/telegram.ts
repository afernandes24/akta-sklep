import 'server-only';

/**
 * Powiadomienia na telefon przez bota Telegram.
 * Wymaga zmiennych: TELEGRAM_BOT_TOKEN i TELEGRAM_CHAT_ID (instrukcja: TELEGRAM.md).
 * Bez nich nic się nie dzieje. Błąd Telegrama nigdy nie psuje zamówienia.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function telegram(title: string, lines: string[] = []): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const text = [`<b>${esc(title)}</b>`, ...lines.map((l) => esc(l).slice(0, 900))].join('\n');
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('[telegram]', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('[telegram]', e);
    return false;
  }
}
