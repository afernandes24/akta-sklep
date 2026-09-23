import { LegalPage, legalMetadata } from '@/components/ui/LegalPage';
import { regulamin } from '@/lib/legal/documents';

export const metadata = legalMetadata(regulamin());

export default function Page() {
  return <LegalPage doc={regulamin()} />;
}
