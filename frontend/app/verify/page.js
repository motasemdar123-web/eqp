import { Suspense } from 'react';
import UnifiedLogin from '../../components/UnifiedLogin';

export default function VerifyPage() {
  return (
    <Suspense>
      <UnifiedLogin preferredModule="auto" />
    </Suspense>
  );
}
