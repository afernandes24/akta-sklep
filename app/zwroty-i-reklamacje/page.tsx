import { LegalPage, legalMetadata } from '@/components/ui/LegalPage';
import { zwroty } from '@/lib/legal/documents';

export const metadata = legalMetadata(zwroty());

export default function Page() {
  return <LegalPage doc={zwroty()} />;
}
