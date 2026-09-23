import { LegalPage, legalMetadata } from '@/components/ui/LegalPage';
import { notaPrawna } from '@/lib/legal/documents';

export const metadata = legalMetadata(notaPrawna());

export default function Page() {
  return <LegalPage doc={notaPrawna()} />;
}
