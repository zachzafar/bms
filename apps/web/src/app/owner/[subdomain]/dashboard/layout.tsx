'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StorageService } from '@/lib/api/storage';
import { client } from '@/lib/api/publicClient';
import { useEffect, useState } from 'react';
import { Building2, Calendar, Wrench, FileText, DollarSign, Home } from 'lucide-react';
import OwnerLogout from '@/components/custom/OwnerLogout';
import { ModeToggle } from '@/components/mode-toggle';

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');

  // Fetch tenant branding data
  const { data: tenantResponse } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-branding', subdomain],
    queryData: {
      params: { subdomain },
    },
  });

  const tenantBranding = tenantResponse?.status === 200 ? tenantResponse.body : null;
  const logoUrl = tenantBranding?.logoUrl;
  const backgroundImage = tenantBranding?.backgroundImage;

  useEffect(() => {
    const ownerUser = StorageService.getOwnerUser();
    const tenant = StorageService.getTenant();

    if (!ownerUser) {
      router.replace(`/owner/${subdomain}/login`);
      return;
    }

    setUserName(ownerUser.name);
    setTenantName(tenant?.name || subdomain);
  }, [subdomain, router]);

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
      {/* Header */}
      <header className="relative z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {logoUrl ? (
                <div className="relative h-10 w-32">
                  <Image
                    src={logoUrl}
                    alt={tenantName || 'Company logo'}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <Building2 className="h-8 w-8 text-primary" />
              )}
              <div>
                <h1 className="text-lg font-bold text-foreground">{tenantName}</h1>
                <p className="text-xs text-muted-foreground">Owner Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
              <ModeToggle />
              <OwnerLogout subdomain={subdomain} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href={`/owner/${subdomain}/dashboard`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Overview
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/assets`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Assets
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/bookings`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/maintenance`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Maintenance
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/invoices`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/payments`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
