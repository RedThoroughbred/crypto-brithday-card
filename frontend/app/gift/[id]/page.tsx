'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GiftRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const giftId = params.id;

  useEffect(() => {
    // Redirect to claim page with GGT type
    if (giftId) {
      router.replace(`/claim?id=${giftId}&type=ggt`);
    }
  }, [giftId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geogift-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading gift...</p>
      </div>
    </div>
  );
}