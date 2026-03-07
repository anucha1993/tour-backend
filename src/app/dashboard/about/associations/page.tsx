import { Suspense } from 'react';
import AboutAssociationsPage from './AssociationsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense>
      <AboutAssociationsPage />
    </Suspense>
  );
}
