import { Suspense } from 'react';
import ReviewsPage from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense>
      <ReviewsPage />
    </Suspense>
  );
}
