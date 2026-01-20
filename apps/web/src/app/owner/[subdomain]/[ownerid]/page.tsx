'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function OwnerRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  useEffect(() => {
    // Redirect to the owner login page
    router.replace(`/owner/${subdomain}/login`);
  }, [subdomain, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-slate-600">Redirecting...</p>
      </div>
    </div>
  );
}
