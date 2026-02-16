'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserIcon,
  Package2Icon,
  ExternalLinkIcon,
} from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { BOOKINGS_QUERY_KEY } from '@/lib/api/queryKeys';
import CopyableId from '@/components/custom/CopyableId';
import { formatDisplayDate } from '@/lib/utils/date';
import { StorageService } from '@/lib/api/storage';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Component() {
  const tenant = StorageService.getTenant();
  const customerPageUrl = tenant?.subdomain ? `/customer/${tenant.subdomain}` : null;

  // Fetch bookings data
  const { data: bookingsData } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
  });

  // Fetch customers data
  const { data: customersData } = authClient.customers.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  // Fetch assets data
  const { data: assetCountData } = authClient.analytics.getAssetCount.useQuery({
    queryKey: ['assetCount'],
  });

  const { data: assetTypeData } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetTypes'],
  });

  // Process data for display
  const bookings = bookingsData?.body.data ?? [];
  const customers = customersData?.body.data ?? [];
  const totalAssets = assetCountData?.body.totalAssets ?? 0
  const assetTypes = assetTypeData?.body.data ?? [];

  // Calculate totals
  const totalBookings = bookingsData?.body.pagination.totalCount;
  const totalCustomers = customers.length;

  // Group bookings by asset type
  const bookingsByAssetType = bookings.reduce((acc, booking) => {
    const assetType = booking.asset.assetTypeId?.toString() || 'unknown';
    acc[assetType] = (acc[assetType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get asset type names for dropdown


  return (
    <>
      <div className='flex items-center justify-between'>
        <h1 className='font-semibold text-lg md:text-2xl'>
          Booking Dashboard
        </h1>
        {customerPageUrl && (
          <Button variant="outline" size="sm" asChild>
            <Link href={customerPageUrl} target="_blank">
              View Customer Page
              <ExternalLinkIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Bookings
            </CardTitle>
            <Package2Icon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-2'>
              <div className='text-2xl font-bold'>{totalBookings}</div>
              {/* <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select asset type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {assetTypes.map((assetType) => (
                    <SelectItem key={assetType.id} value={assetType.id.toString()}>{assetType.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
              <p className='text-xs text-muted-foreground'>
              Total Bookings
            </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Customers
            </CardTitle>
            <UserIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalCustomers}</div>
            <p className='text-xs text-muted-foreground'>
              Registered customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Assets
            </CardTitle>
            <Package2Icon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalAssets || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Available assets
            </p>
          </CardContent>
        </Card>

      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[100px]'>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length > 0 ? (
                bookings.slice(0, 5).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      <CopyableId id={booking.id} />
                    </TableCell>
                    <TableCell>{booking.customer?.name || 'Unknown'}</TableCell>
                    <TableCell>{booking.asset?.name || 'Unknown Asset'}</TableCell>
                    <TableCell>{formatDisplayDate(booking.startDate)}</TableCell>
                    <TableCell>{formatDisplayDate(booking.endDate)}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No bookings found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
