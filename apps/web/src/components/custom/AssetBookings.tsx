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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/api/publicClient';
import { InsertBookingSchema, SelectAsset, SelectCustomer } from '@repo/api-contract';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MultiSelector, MultiSelectorTrigger, MultiSelectorInput, MultiSelectorContent, MultiSelectorList, MultiSelectorItem } from '../extension/multi-select';

// Define the form schema with zod
const bookingFormSchema = z.object({
  ...InsertBookingSchema.shape,
  customers: z.array(z.number()),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function AssetBookings({ asset }: { asset: SelectAsset}) {
  const [customers, setCustomers] = useState<number[]>([]);
  const { data } = authClient.booking.getBookings.useQuery({ queryKey: ['bookings',asset.id]})
  const { mutate: createBooking } = authClient.booking.createBooking.useMutation();
  const { data: customerResponse } = authClient.users.getCustomers.useQuery({ queryKey: ['customers']})
  const customerList = customerResponse?.body?? [];
  const bookings = data?.body ?? [];
  
  const [isOpen, setIsOpen] = useState(false);

  // Initialize react-hook-form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      status: '',
      assetId: asset.id,
      customers: [],
    },
  });

  const onSubmit = (values: BookingFormValues) => {
    createBooking({
      body: {
        booking: {
          startDate: new Date(values.startDate),
          endDate: new Date(values.endDate),
          status: '',
          assetId: asset.id
        },
          customers: customers,
        },
    });
    setIsOpen(false);
    form.reset();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bookings</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Add Booking</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          type="date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value.toISOString().split('T')[0]}
                          type="date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem>
                <FormLabel>Fields</FormLabel>
                <MultiSelector
                  values={customers}
                  onValuesChange={setCustomers}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Select Fields..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {/* {customerList.map((customer) => (
                        <MultiSelectorItem
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.name}
                        </MultiSelectorItem>
                      ))} */}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
                <FormMessage />
              </FormItem>
                <Button type="submit" className="w-full">
                  Create Booking
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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