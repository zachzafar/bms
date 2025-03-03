'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { authClient } from '@/lib/api/publicClient';
import { SelectAsset } from '@repo/api-contract';



export default function AssetBookings({ asset }: { asset: SelectAsset}) {
  const { data } = authClient.booking.getBookings.useQuery({ queryKey: ['bookings',asset.id]})
  const bookings = data?.body ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.startDate.toLocaleDateString()}</TableCell>
                <TableCell>{booking.endDate.toLocaleDateString()}</TableCell>
                <TableCell>
                  <div>{booking.customer.userId}</div>
                </TableCell>
                <TableCell>
                  <span className={`capitalize ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}