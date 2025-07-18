'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/api/publicClient';
import { BOOKINGS_QUERY_KEY } from '@/lib/api/queryKeys';
import { ExtendedSelectBooking } from '@repo/api-contract/src/api-contract/booking';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { MultiSelector, MultiSelectorTrigger, MultiSelectorInput, MultiSelectorContent, MultiSelectorList, MultiSelectorItem } from '@/components/extension/multi-select';

// Define the booking form schema
const bookingFormSchema = z.object({
  assetId: z.string().min(1, { message: 'Asset is required' }),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  endDate: z.string().min(1, { message: 'End date is required' }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function Component() {
  const queryClient = authClient.useQueryClient();
  const { data: bookings } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
  });
  
  const { data: tagsResponse } = authClient.settings.tags.getTags.useQuery({ queryKey: ['tags'] });
  const tagList = tagsResponse?.body ?? [];

  const { mutate: createBooking } = authClient.booking.createBooking.useMutation();
  const { mutate: createBookingByTag } = authClient.booking.createBookingByTag.useMutation();

  const { data: assets } = authClient.assets.getAssets.useQuery({ queryKey: ['assets'] });
  const assetList = assets?.body ?? [];
  const { data: customerResponse } = authClient.users.getCustomers.useQuery({ queryKey: ['customers'] })
  const customerList = customerResponse?.body ?? [];
  const [customers, setCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedBooking, setSelectedBooking] = useState<ExtendedSelectBooking>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Initialize react-hook-form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      assetId: '',
      // tagId: '',
      startDate: '',
      endDate: '',
    },
  });

  const handleSort = (column: any) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleCancel = (id: string) => {
    // Implement cancel booking logic here
  };

//   const onSubmit = (values: BookingFormValues) => {
//   createBookingByTag({
//     body: {
//       tagId: parseInt(values.tagId),
//       startDate: values.startDate,
//       endDate: values.endDate,
//       customerIds: customers.map((id) => parseInt(id)),
//     }
//   }, {
//     onSuccess: () => {
//       toast.success('Booking created successfully');
//       queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
//       setIsCreateDialogOpen(false);
//       form.reset();
//     },
//     onError: (error) => {
//       toast.error('Failed to create booking');
//       console.error(error);
//     }
//   });
// };

  const onSubmit = (values: BookingFormValues) => {
    createBooking({
      body: {
        booking: {
          assetId: values.assetId,
          startDate: values.startDate,
          endDate: values.endDate,
        },
        customers: customers.map((customerId) => parseInt(customerId)),
      }
    }, {
      onSuccess: () => {
        toast.success('Booking created successfully');
        queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
        setIsCreateDialogOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error('Failed to create booking');
        console.error(error);
      }
    });
  };

  return (
    <>
      <div className='flex items-center justify-between'>
        <h1 className='font-semibold text-lg md:text-2xl'>Bookings</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Booking</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Enter the details for the new booking
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assetList.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Customers</FormLabel>
                  <MultiSelector
                    values={customers}
                    onValuesChange={setCustomers}
                  >
                    <MultiSelectorTrigger>
                      <MultiSelectorInput placeholder="Select Customers..." />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {customerList.map((customer) => (
                          <MultiSelectorItem
                            key={customer.customer.id}
                            value={customer.customer.id.toString()}
                          >
                            {customer.user.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                  <FormMessage />
                </FormItem>
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
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
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create Booking
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <Input
            className='max-w-xs'
            placeholder='Search bookings...'
            type='search'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size='icon' variant='outline'>
            <SearchIcon className='h-4 w-4' />
            <span className='sr-only'>Search</span>
          </Button>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Types</SelectItem>
              <SelectItem value='Car'>Car</SelectItem>
              <SelectItem value='Room'>Room</SelectItem>
              <SelectItem value='Equipment'>Equipment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='All'>All Statuses</SelectItem>
              <SelectItem value='Active'>Active</SelectItem>
              <SelectItem value='Upcoming'>Upcoming</SelectItem>
              <SelectItem value='Completed'>Completed</SelectItem>
              <SelectItem value='Cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='border shadow-sm rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>
                <Button variant='ghost' onClick={() => handleSort('id')}>
                  Booking ID{' '}
                  {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('assetName')}>
                  Asset{' '}
                  {sortBy === 'assetName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('assetType')}>
                  Type{' '}
                  {sortBy === 'assetType' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  onClick={() => handleSort('customerName')}
                >
                  Customer{' '}
                  {sortBy === 'customerName' &&
                    (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('startDate')}>
                  Start Date{' '}
                  {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('endDate')}>
                  End Date{' '}
                  {sortBy === 'endDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant='ghost' onClick={() => handleSort('status')}>
                  Status{' '}
                  {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.status === 200 ? bookings.body.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className='font-medium'>{booking.id}</TableCell>
                <TableCell>{booking.asset.name}</TableCell>
                <TableCell>{booking.asset.assetTypeId}</TableCell>
                <TableCell>{booking.customer.id}</TableCell>
                <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(booking.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setSelectedBooking(booking)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Booking Details</DialogTitle>
                          <DialogDescription>
                            Booking ID: {selectedBooking?.id}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedBooking && (
                          <div className='grid gap-4 py-4'>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Asset:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.asset.name}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Type:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.asset.assetTypeId}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Customer:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.customer.id}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Start Date:</Label>
                              <div className='col-span-3'>
                                {new Date(selectedBooking.startDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>End Date:</Label>
                              <div className='col-span-3'>
                                {new Date(selectedBooking.endDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className='grid grid-cols-4 items-center gap-4'>
                              <Label className='text-right'>Status:</Label>
                              <div className='col-span-3'>
                                {selectedBooking.status}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant='outline' size='sm'>
                      Edit
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={8}>No bookings found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
