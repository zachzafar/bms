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

interface Booking {
  id: string;
  startDate: Date;
  endDate: Date;
  user: {
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

interface AssetBookingsProps {
  bookings: Booking[];
}

export default function AssetBookings({ bookings }: AssetBookingsProps) {
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
                  <div>{booking.user.name}</div>
                  <div className="text-sm text-gray-500">{booking.user.email}</div>
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