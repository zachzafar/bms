'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  CalendarIcon,
  UserIcon,
  Package2Icon,
} from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { BOOKINGS_QUERY_KEY } from '@/lib/api/queryKeys';

export default function Component() {
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  
  // Fetch bookings data
  const { data: bookingsData } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
  });
  
  // Fetch customers data
  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
  });
  
  // Fetch assets data
  const { data: assetsData } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets'],
  });

  const { data: assetTypeData} = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['assetTypes'],
  });

  // Process data for display
  const bookings = bookingsData?.body ?? [];
  const customers = customersData?.body ?? [];
  const assets = assetsData?.body ?? [];
  
  // Calculate totals
  const totalBookings = bookings.length;
  const totalCustomers = customers.length;
  
  // Group bookings by asset type
  const bookingsByAssetType = bookings.reduce((acc, booking) => {
    const assetType = booking.asset.assetTypeId?.toString() || 'unknown';
    acc[assetType] = (acc[assetType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get asset type names for dropdown
  
  
  // Get bookings count for selected asset type
  const selectedTypeBookings = selectedAssetType === 'all' 
    ? totalBookings 
    : bookingsByAssetType[selectedAssetType] || 0;

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>
          Booking Dashboard
        </h1>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Bookings
            </CardTitle>
            <CalendarIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalBookings}</div>
            <p className='text-xs text-muted-foreground'>
              All time bookings
            </p>
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
              Asset Bookings
            </CardTitle>
            <Package2Icon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-2'>
              <div className='text-2xl font-bold'>{selectedTypeBookings}</div>
              <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select asset type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {Object.entries(assetTypes).map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className='border shadow-sm rounded-lg mt-6'>
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
                  <TableCell className='font-medium'>{booking.id}</TableCell>
                  <TableCell>{booking.user?.name || booking.customer?.userId || 'Unknown'}</TableCell>
                  <TableCell>{booking.asset?.name || 'Unknown Asset'}</TableCell>
                  <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(booking.endDate).toLocaleDateString()}</TableCell>
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
      </div>
    </>
  );
}
