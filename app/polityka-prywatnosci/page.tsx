import { LegalPage, legalMetadata } from '@/components/ui/LegalPage';
import { politykaPrywatnosci } from '@/lib/legal/documents';

export const metadata = legalMetadata(politykaPrywatnosci());

export default function Page() {
  return <LegalPage doc={politykaPrywatnosci()} />;
}
