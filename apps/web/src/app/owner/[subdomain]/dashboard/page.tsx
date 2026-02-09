'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authClient } from '@/lib/api/publicClient';
import { Calendar, Wrench, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDisplayDate } from '@/lib/utils/date';

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">View and track your property operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{bookingsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active and completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$0</div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
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
                className="text-sm font-normal text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{booking.asset?.name || 'Asset'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                      </p>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'outline'}>
                      {booking.status}
                    </Badge>
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
                className="text-sm font-normal text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </CardTitle>
            <CardDescription>Latest maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMaintenance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No maintenance tasks yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMaintenance.map((task: any) => (
                  <div key={task.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{task.description || 'No description'}</p>
                    </div>
                    <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start space-x-3 pt-6">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground">Read-Only Access</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This portal provides view-only access to your property information. For any changes or updates, please contact your property manager.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
