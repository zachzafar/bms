'use client';

import { useParams } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Image from 'next/image';
import { Building2 } from 'lucide-react';

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const subdomain = params.subdomain as string;

  // Fetch tenant data including branding
  const { data: tenantResponse } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-branding', subdomain],
    queryData: {
      params: { subdomain },
    },
  });

  const tenant = tenantResponse?.status === 200 ? tenantResponse.body : null;
  const logoUrl = tenant?.logoUrl;
  const backgroundImage = tenant?.backgroundImage;

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay for better text readability when background image is set */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      )}

      {/* Header with logo */}
      <header className="relative z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {logoUrl ? (
                <div className="relative h-10 w-32">
                  <Image
                    src={logoUrl}
                    alt={tenant?.name || 'Company logo'}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <>
                  <Building2 className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold text-foreground">
                    {tenant?.name || subdomain}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
