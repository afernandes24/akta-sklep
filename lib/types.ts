export type ExcerptType = 'raport' | 'przesluchanie' | 'notatka' | 'wiadomosc' | 'wycinek';

export interface Excerpt {
  type: ExcerptType;
  title: string;
  meta?: string;
  body: string;
  stamp?: string;
}

export interface CaseRecord {
  id: string;
  slug: string;
  case_number: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  contents: string[];
  excerpts: Excerpt[];
  difficulty: number;
  play_time_minutes: number;
  page_count: number;
  suspect_count: number;
  price_grosze: number;
  currency: string;
  cover_path: string | null;
  is_published: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  /** Wersja online (akta do czytania w przeglądarce) — osobny produkt z własną ceną. */
  online_enabled?: boolean;
  online_price_grosze?: number | null;
  /** Miasto, w którym dzieje się sprawa (dział „Mapa zbrodni”). */
  city?: string | null;
  /** Liczba nagrań z przesłuchań (AI) — utrzymywana przez trigger w bazie. */
  recordings_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CaseRating {
  avg: number;
  count: number;
}

export interface Review {
  id: string;
  case_id: string;
  rating: number;
  body: string;
  author_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CaseImage {
  id: string;
  case_id: string;
  path: string;
  caption: string | null;
  sort_order: number;
}

export interface CaseFile {
  id: string;
  case_id: string;
  label: string;
  file_name: string;
  storage_path: string;
  size_bytes: number | null;
  is_solution: boolean;
  sort_order: number;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  case_id: string | null;
  title: string;
  price_grosze: number;
  list_price_grosze?: number | null;
  format?: ProductFormat;
}

export interface Order {
  id: string;
  order_number: number;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  total_grosze: number;
  subtotal_grosze?: number | null;
  discount_grosze?: number;
  discount_code?: string | null;
  discount_label?: string | null;
  currency: string;
  provider: string;
  provider_ref: string | null;
  created_at: string;
  paid_at: string | null;
  order_items?: OrderItem[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

/** Wersja produktu: PDF do druku albo akta online w przeglądarce. */
export type ProductFormat = 'pdf' | 'online';

export const FORMAT_LABEL: Record<ProductFormat, string> = { pdf: 'PDF do druku', online: 'Wersja online' };

/** Klucz pozycji w koszyku: sprawa + wersja. */
export const cartKey = (i: { id: string; format?: ProductFormat }) => `${i.id}:${i.format ?? 'pdf'}`;

/** Minimalne dane sprawy przechowywane w koszyku (localStorage). */
export interface CartItem {
  id: string;
  format?: ProductFormat;
  slug: string;
  title: string;
  caseNumber: string;
  priceGrosze: number;
}
