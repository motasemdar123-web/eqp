import { Suspense } from 'react';
import UnifiedLogin from '../components/UnifiedLogin';

export default function LoginPage() {
  return (
    <Suspense>
      <UnifiedLogin />
    </Suspense>
  );
}
