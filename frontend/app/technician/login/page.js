import { Suspense } from 'react';
import UnifiedLogin from '../../../components/UnifiedLogin';

export default function TechnicianLoginPage() {
  return (
    <Suspense>
      <UnifiedLogin preferredModule="auto" />
    </Suspense>
  );
}
