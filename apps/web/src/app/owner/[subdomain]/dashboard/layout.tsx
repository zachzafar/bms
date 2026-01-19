'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StorageService } from '@/lib/api/storage';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Building2, Calendar, Wrench, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = StorageService.getToken();
    const user = StorageService.getUser();
    const tenant = StorageService.getTenant();

    if (!token || !user) {
      router.replace(`/owner/${subdomain}/login`);
      return;
    }

    // Verify user is an owner
    if (user.userType !== 'owner') {
      toast.error('Access denied. Owner credentials required.');
      router.replace(`/owner/${subdomain}/login`);
      return;
    }

    setUserName(user.name);
    setTenantName(tenant?.name || subdomain);
  }, [subdomain, router]);

  const handleLogout = () => {
    StorageService.clearAuth();
    toast.success('Logged out successfully');
    router.replace(`/owner/${subdomain}/login`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">{tenantName}</h1>
                <p className="text-xs text-slate-500">Owner Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome, {userName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href={`/owner/${subdomain}/dashboard`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Overview
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/bookings`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/maintenance`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Maintenance
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/invoices`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </Link>
            <Link
              href={`/owner/${subdomain}/dashboard/payments`}
              className="flex items-center px-1 py-4 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
