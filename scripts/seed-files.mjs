#!/usr/bin/env node
/**
 * Wgrywa gotowe materiały WSZYSTKICH spraw z katalogu content/akta-XXX do Supabase:
 *  - tworzy brakujące produkty z meta.json (istniejących nie nadpisuje, chyba że --update),
 *  - 5 plików PDF (prywatny bucket „case-files”) — pobierają je tylko kupujący,
 *  - 4 przykładowe strony (publiczny bucket „previews”) — widoczne na stronie produktu.
 * Opcjonalnie nadaje uprawnienia administratora.
 *
 * Użycie:
 *   npm run seed:files
 *   npm run seed:files -- --only 002            (tylko jedna sprawa)
 *   npm run seed:files -- --update              (nadpisz opisy/ceny z meta.json)
 *   npm run seed:files -- --admin twoj@email.pl
 *
 * Wymaga w .env.local: NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY
 * Skrypt można uruchamiać wielokrotnie — podmienia pliki, nie tworzy duplikatów.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const name of ['.env.local', '.env']) {
  const p = join(root, name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '').replace(/\/(rest|auth|storage)\/v1$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('✗ Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const only = arg('--only');
const update = process.argv.includes('--update');

const SHOP_KEYS = [
  'tags', 'city', 'slug', 'case_number', 'title', 'tagline', 'description', 'highlights', 'contents', 'excerpts', 'difficulty',
  'play_time_minutes', 'page_count', 'suspect_count', 'price_grosze', 'sort_order', 'seo_title', 'seo_description',
];

const contentDir = join(root, 'content');
const caseDirs = readdirSync(contentDir)
  .filter((d) => /^akta-\d{3}$/.test(d) && existsSync(join(contentDir, d, 'meta.json')))
  .filter((d) => !only || d === `akta-${only}`)
  .sort();

let failures = 0;

for (const dir of caseDirs) {
  const caseDir = join(contentDir, dir);
  const meta = JSON.parse(readFileSync(join(caseDir, 'meta.json'), 'utf8'));
  console.log(`\n── AKTA #${meta.case_number} — ${meta.title}`);

  // Darmowa sprawa próbna (newsletter) — tylko pliki, bez produktu w sklepie
  if (meta.free) {
    for (const fileName of readdirSync(join(caseDir, 'pdf')).filter((f) => f.endsWith('.pdf')).sort()) {
      const up = await db.storage
        .from('case-files')
        .upload(`free/${meta.case_number}/${fileName}`, readFileSync(join(caseDir, 'pdf', fileName)), { contentType: 'application/pdf', upsert: true });
      if (up.error) {
        console.error(`✗ ${fileName}: ${up.error.message}`);
        failures++;
      } else console.log(`✓ PDF (darmowy) ${fileName}`);
    }
    continue;
  }

  // ─── Produkt ──────────────────────────────────────────────────────
  let { data: c } = await db.from('cases').select('id').eq('slug', meta.slug).maybeSingle();
  if (!meta.manual && (!c || update)) {
    const row = Object.fromEntries(SHOP_KEYS.map((k) => [k, meta[k]]));
    const res = c
      ? await db.from('cases').update(row).eq('id', c.id).select('id').single()
      : await db.from('cases').insert({ ...row, is_published: true }).select('id').single();
    if (res.error) {
      console.error(`✗ Produkt: ${res.error.message}`);
      failures++;
      continue;
    }
    c = res.data;
    console.log(update ? '✓ Produkt zaktualizowany' : '✓ Produkt utworzony');
  }
  if (!c) {
    console.error(`✗ Nie znaleziono sprawy "${meta.slug}". Najpierw uruchom supabase/schema.sql i supabase/seed.sql.`);
    failures++;
    continue;
  }

  // ─── PDF-y ─────────────────────────────────────────────────────────
  const pdfDir = join(caseDir, 'pdf');
  const pdfs = readdirSync(pdfDir).filter((f) => f.endsWith('.pdf')).sort();
  for (const [i, fileName] of pdfs.entries()) {
    const storagePath = `${c.id}/${dir}-${fileName}`;
    const up = await db.storage
      .from('case-files')
      .upload(storagePath, readFileSync(join(pdfDir, fileName)), { contentType: 'application/pdf', upsert: true });
    if (up.error) {
      console.error(`✗ ${fileName}: ${up.error.message}`);
      failures++;
      continue;
    }
    const row = {
      case_id: c.id,
      label: meta.file_labels?.[fileName] ?? fileName,
      file_name: fileName,
      storage_path: storagePath,
      size_bytes: statSync(join(pdfDir, fileName)).size,
      is_solution: /ROZWIAZAN|ODPOWIEDZ|ANSWER/i.test(fileName),
      sort_order: i,
    };
    const { data: existing } = await db.from('case_files').select('id').eq('storage_path', storagePath).maybeSingle();
    if (existing) await db.from('case_files').update(row).eq('id', existing.id);
    else await db.from('case_files').insert(row);
    console.log(`✓ PDF  ${fileName}`);
  }

  // Usuń stare pliki zastępcze z wcześniejszych wersji skryptu
  const { data: old } = await db.from('case_files').select('id, storage_path').eq('case_id', c.id).like('storage_path', `${c.id}/seed-%`);
  if (old?.length) {
    await db.storage.from('case-files').remove(old.map((o) => o.storage_path));
    await db.from('case_files').delete().in('id', old.map((o) => o.id));
    console.log(`✓ Usunięto ${old.length} plików zastępczych`);
  }

  // ─── Przykładowe strony ────────────────────────────────────────────
  const prevDir = join(caseDir, 'previews');
  for (const [i, p] of (meta.previews ?? []).entries()) {
    const path = `${c.id}/${dir}-${p.file}`;
    const up = await db.storage
      .from('previews')
      .upload(path, readFileSync(join(prevDir, p.file)), { contentType: 'image/jpeg', upsert: true });
    if (up.error) {
      console.error(`✗ ${p.file}: ${up.error.message}`);
      failures++;
      continue;
    }
    const { data: existing } = await db.from('case_images').select('id').eq('path', path).maybeSingle();
    if (!existing) await db.from('case_images').insert({ case_id: c.id, path, caption: p.caption ?? null, sort_order: i });
    console.log(`✓ Podgląd ${p.file}`);
  }

}

// ─── Admin ─────────────────────────────────────────────────────────
const adminEmail = arg('--admin');
if (adminEmail) {
  const email = adminEmail.toLowerCase();
  const { data, error: e } = await db.from('profiles').update({ is_admin: true }).ilike('email', email).select('email');
  if (e || !data?.length) console.error(`✗ Nie znaleziono konta ${email} — najpierw zarejestruj się w sklepie.`);
  else console.log(`✓ ${email} jest teraz administratorem`);
}

console.log(failures ? `\nZakończono z błędami (${failures}).` : `\nGotowe. Wgrano ${caseDirs.length} spraw. Sprawdź: /admin/sprawy`);
process.exit(failures ? 1 : 0);
