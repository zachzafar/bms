'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/api/publicClient';
import { Calendar, Wrench, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OwnerDashboardPage() {
  const params = useParams();
  const subdomain = params.subdomain as string;

  // Fetch bookings data - using owner-specific endpoint
  const { data: bookingsResponse, isLoading: loadingBookings } = authClient.booking.getOwnerBookings.useQuery({
    queryKey: ['owner-bookings-overview'],
    queryData: {
      query: { page: 1, pageSize: 5 },
    },
  });

  // Fetch maintenance data - using owner-specific endpoint
  const { data: maintenanceResponse, isLoading: loadingMaintenance } = authClient.maintenance.getOwnerMaintenances.useQuery({
    queryKey: ['owner-maintenance-overview'],
    queryData: {
      query: { page: 1, pageSize: 5 },
    },
  });

  const bookingsCount = bookingsResponse?.status === 200 ? bookingsResponse.body.pagination.totalCount : 0;
  const maintenanceCount = maintenanceResponse?.status === 200 ? maintenanceResponse.body.pagination.totalCount : 0;

  const recentBookings = bookingsResponse?.status === 200 ? bookingsResponse.body.data.slice(0, 5) : [];
  const recentMaintenance = maintenanceResponse?.status === 200 ? maintenanceResponse.body.data.slice(0, 5) : [];

  if (loadingBookings || loadingMaintenance) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-2">View and track your property operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{bookingsCount}</div>
            <p className="text-xs text-slate-500 mt-1">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Maintenance Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{maintenanceCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active and completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">$0</div>
            <p className="text-xs text-slate-500 mt-1">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Bookings</span>
              <Link
                href={`/owner/${subdomain}/dashboard/bookings`}
                className="text-sm font-normal text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{booking.asset?.name || 'Asset'}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Maintenance</span>
              <Link
                href={`/owner/${subdomain}/dashboard/maintenance`}
                className="text-sm font-normal text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </CardTitle>
            <CardDescription>Latest maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMaintenance.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No maintenance tasks yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMaintenance.map((task: any) => (
                  <div key={task.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{task.description || 'No description'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start space-x-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Read-Only Access</h3>
            <p className="text-sm text-blue-700 mt-1">
              This portal provides view-only access to your property information. For any changes or updates, please contact your property manager.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
