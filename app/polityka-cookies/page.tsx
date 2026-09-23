import { LegalPage, legalMetadata } from '@/components/ui/LegalPage';
import { politykaCookies } from '@/lib/legal/documents';

export const metadata = legalMetadata(politykaCookies());

export default function Page() {
  return <LegalPage doc={politykaCookies()} />;
}
