'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CustomDomainPortalPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function lookupDomain() {
      try {
        const domain = decodeURIComponent(params.domain as string);
        
        // Look up the organization by custom domain
        const response = await fetch(`/api/portal/lookup-domain?domain=${encodeURIComponent(domain)}`);
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Portal not found');
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.portalSlug) {
          // Redirect to the actual portal page
          router.replace(`/portal/${data.portalSlug}`);
        } else {
          setError('Portal not configured for this domain');
          setLoading(false);
        }
      } catch (err) {
        console.error('Domain lookup error:', err);
        setError('Failed to load portal');
        setLoading(false);
      }
    }

    lookupDomain();
  }, [params.domain, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}

