'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SearchIcon } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { BOOKINGS_QUERY_KEY, RATES_QUERY_KEY } from '@/lib/api/queryKeys';
import { ExtendedSelectBooking } from '@repo/api-contract'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { toast } from 'sonner';
import { MultiSelector, MultiSelectorTrigger, MultiSelectorInput, MultiSelectorContent, MultiSelectorList, MultiSelectorItem, } from '@/components/extension/multi-select';
import { StorageService } from '@/lib/api/storage';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, Clock, XCircle, Eye, Trash2, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CopyableId from '@/components/custom/CopyableId';
import { DateRangePicker, BlockedDateRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { formatDisplayDate } from '@/lib/utils/date';


// Booking form schema
const bookingFormSchema = z.object({
  assetId: z.string().min(1, { message: 'Asset is required' }),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string().default('00:00'),
  endTime: z.string().default('23:59'),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Helper: calculate duration in minutes between two dates
function calculateDurationMinutes(start: Date | string, end: Date | string) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  return Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60)
  );
}

// Helper: get status badge variant and icon
function getStatusBadge(status: string) {
  switch (status) {
    case 'Confirmed':
      return { variant: 'default' as const, color: 'bg-primary/10 text-primary', icon: CheckCircle };
    case 'Pending':
      return { variant: 'secondary' as const, color: 'bg-secondary/10 text-secondary-foreground', icon: Clock };
    case 'Cancelled':
      return { variant: 'destructive' as const, color: 'bg-destructive/10 text-destructive', icon: XCircle };
    default:
      return { variant: 'outline' as const, color: 'bg-muted text-gray-800', icon: Clock };
  }
}

// Helper: find applicable rate for asset and duration (in minutes)
function getApplicableRate(
  assetId: string,
  durationMinutes: number,
  rates: {
    assetId: string;
    minDuration?: number;
    maxDuration?: number;
    pricePerUnit?: number;
    priority?: number;
  }[]
) {
  const applicableRates = rates.filter(
    (rate) =>
      rate.assetId === assetId &&
      (!rate.minDuration || rate.minDuration <= durationMinutes) &&
      (!rate.maxDuration || rate.maxDuration >= durationMinutes)
  );
  if (applicableRates.length === 0) return null;
  return applicableRates.reduce((prev, curr) =>
    (prev.priority ?? 100) < (curr.priority ?? 100) ? prev : curr
  );
}

export default function Component() {
  const router = useRouter();
  const currentTenant = StorageService.getTenant();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);

  const queryClient = authClient.useQueryClient();
  const { data: bookings, refetch } = authClient.booking.getBookings.useQuery({
    queryKey: [...BOOKINGS_QUERY_KEY, page, pageSize],
    queryData: {query:queryParams},
  });

  const { data: tagsResponse } = authClient.settings.tags.getTags.useQuery({
    queryKey: ['tags'],
  });
  const tagList = tagsResponse?.body?.data ?? [];

  const bookingList = bookings?.status === 200 ? bookings.body.data : [];
  const paginationMeta = bookings?.status === 200 ? bookings.body.pagination : undefined;

  const { mutate: createBooking } = authClient.booking.createBooking.useMutation();
  const { mutate: generateInvoiceFromBooking } = authClient.billing.generateInvoiceFromBooking.useMutation();
  const { mutate: createBookingByTag } = authClient.booking.createBookingByTag.useMutation();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  // Fetch blocked dates for selected asset using standard React Query pattern
  const { data: blockedDatesResponse } = authClient.blockedDates.getBlockedDatesForAssetPublic.useQuery({
    queryKey: ['blocked-dates', selectedAssetId],
    queryData: { params: { assetId: selectedAssetId } },
    enabled: !!selectedAssetId,
  });

  // Transform blocked dates data
  const assetBlockedDates: BlockedDateRange[] = useMemo(() => {
    if (blockedDatesResponse?.status !== 200) return [];
    return blockedDatesResponse.body.map((b) => ({
      startDate: new Date(b.startDate),
      endDate: new Date(b.endDate),
    }));
  }, [blockedDatesResponse]);

  // Asset search and filter state
  const [assetSearch, setAssetSearch] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<number | undefined>(undefined);

  // Fetch asset types for filtering
  const { data: assetTypesResponse } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['asset-types'],
  });
  const assetTypes = assetTypesResponse?.body?.data ?? [];

  // Fetch assets with search and filter
  const { data: assets } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets', assetSearch, assetTypeFilter],
    queryData: {
      query: {
        search: assetSearch || undefined,
        assetTypeId: assetTypeFilter,
      },
    },
  });
  const assetList = assets?.body.data || [];

  const { data: customerResponse } = authClient.customers.getCustomers.useQuery({ queryKey: ['customers'] });
  const customerList = customerResponse?.body.data ?? [];
  const [customers, setCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch raw rates response
  const { data: ratesResponse } = authClient.rates.getRates.useQuery({
    queryKey: RATES_QUERY_KEY,
  });

  // Flatten rates from grouped structure to array with assetId attached
  const [rates, setRates] = useState<
    {
      id: number;
      assetId: string;
      minDuration?: number;
      maxDuration?: number;
      pricePerUnit?: number;
      priority?: number;
    }[]
  >([]);

  useEffect(() => {
    if (ratesResponse?.status === 200) {
      const allRates = ratesResponse.body.data.flatMap((item) =>
        item.assetIds.map((assetId) => ({
          ...item.rate,
          assetId,
          minDuration: item.rate.minDuration ?? undefined,
          maxDuration: item.rate.maxDuration ?? undefined,
          pricePerUnit: item.rate.pricePerUnit
            ? Number(item.rate.pricePerUnit)
            : undefined,
          priority: item.rate.priority ?? undefined,
        }))
      );
      setRates(allRates);
    } else {
      setRates([]);
    }
  }, [ratesResponse]);

  // react-hook-form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      assetId: '',
      startTime: '00:00',
      endTime: '23:59',
    },
  });








  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');

  // Sync date range + time into form startDate/endDate
  useEffect(() => {
    if (dateRange?.from) {
      const [sh, sm] = (startTime || '00:00').split(':').map(Number);
      const start = new Date(dateRange.from);
      start.setHours(sh, sm, 0, 0);
      form.setValue('startDate', start);
    }
    if (dateRange?.to) {
      const [eh, em] = (endTime || '23:59').split(':').map(Number);
      const end = new Date(dateRange.to);
      end.setHours(eh, em, 0, 0);
      form.setValue('endDate', end);
    }
  }, [dateRange, startTime, endTime, form]);



  const onSubmit = (values: BookingFormValues) => {
    createBooking(
      {
        body: {
          booking: {
            assetId: values.assetId,
            startDate: values.startDate,
            endDate: values.endDate,
          },
          customers: customers.map((customerId) => parseInt(customerId)),
        },
      },
      {
        onSuccess: (response) => {
          toast.success('Booking created successfully');
          queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
          setIsCreateDialogOpen(false);
          form.reset();
          setCustomers([]);

          // Generate invoice after booking creation
          const bookingId = response.body.bookingId; // <- now comes from backend
          const tenant = StorageService.getTenant();
          const tenantId = tenant?.id;

          console.log(tenantId);

          if (bookingId && tenantId) {
            generateInvoiceFromBooking(
              {
                params: { bookingId },
                body: {},
              },
              {
                onSuccess: () => toast.success('Invoice generated successfully'),
                onError: (err) => {
                  console.error('Failed to generate invoice:', err);
                  toast.error('Failed to generate invoice');
                },
              }
            );
          } else {
            console.warn('No bookingId or tenantId available to generate invoice');
          }
        },
        onError: (error: any) => {
          // Extract error message from API response
          const errorMessage = error?.body?.message || error?.message || 'Failed to create booking';
          toast.error(errorMessage);
          console.error(error);
        },
      }
    );
  };





  const handleSort = (column: any) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Note: cancelBooking endpoint actually DELETES the booking (deletes cancelled bookings)
  const { mutate: deleteBookingMutation } = authClient.booking.cancelBooking.useMutation({
    onSuccess: () => {
      toast.success('Booking deleted.');
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.body?.message || 'Failed to delete booking.';
      toast.error(errorMessage);
    },
  });

  const { mutate: updateBookingStatus } = authClient.booking.updateBookingStatus.useMutation({
    onSuccess: () => {
      toast.success('Booking status updated.');
      refetch();
    },
    onError: () => {
      toast.error('Failed to update booking status.');
    },
  });

  const handleDelete = (booking: { id: string; status?: string | null }) => {
    if (booking.status !== 'Cancelled') {
      toast.error('Booking must be cancelled before it can be deleted. Please cancel the booking first.');
      return;
    }
    const confirmed = confirm(`Delete this cancelled booking? This action cannot be undone.`);
    if (confirmed) {
      deleteBookingMutation({ params: { id: booking.id }, body: {} });
    }
  };

  const handleStatusChange = (bookingId: string, newStatus: 'Pending' | 'Confirmed' | 'Cancelled') => {
    updateBookingStatus({
      params: { id: bookingId },
      body: { status: newStatus },
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Bookings</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                form.reset();
                setCustomers([]);
                setSelectedAssetId('');
                setDateRange(undefined);
                setAssetSearch('');
                setAssetTypeFilter(undefined);
              }}
            >
              Create Booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Enter the details for the new booking
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 py-4"
              >
                {/* Asset Selection - First */}
                <div className="space-y-3">
                  <label className="text-sm font-medium leading-none">Asset</label>

                  {/* Search and Filter Row */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search assets..."
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={assetTypeFilter?.toString() ?? 'all'}
                      onValueChange={(value) => setAssetTypeFilter(value === 'all' ? undefined : Number(value))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {assetTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Asset Selection */}
                  <FormField
                    control={form.control}
                    name="assetId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedAssetId(value);
                            // Reset date range when asset changes
                            setDateRange(undefined);
                            form.setValue('startDate', undefined as any);
                            form.setValue('endDate', undefined as any);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetList.length > 0 ? (
                              assetList.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                  {asset.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No assets found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date Range Selection - Second (only enabled after asset selected) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Booking Dates
                  </label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    blockedDates={assetBlockedDates}
                    placeholder={selectedAssetId ? "Select booking dates" : "Select an asset first"}
                    disabled={!selectedAssetId}
                    minDate={new Date()}
                    numberOfMonths={2}
                  />
                  {!selectedAssetId && (
                    <p className="text-sm text-muted-foreground">
                      Please select an asset first to see available dates
                    </p>
                  )}
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} disabled={!selectedAssetId} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} disabled={!selectedAssetId} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Customer Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Customers
                  </label>

                  <MultiSelector
                    values={customers}
                    onValuesChange={setCustomers}
                    getDisplayValue={(id) => {
                      const customer = customerList.find(c => c.id.toString() === id);
                      return customer?.name ?? id;
                    }}
                  >
                    <MultiSelectorTrigger>
                      <MultiSelectorInput placeholder="Select Customers..." />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {customerList.map((customer) => (
                          <MultiSelectorItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedAssetId || !dateRange?.from || !dateRange?.to}
                >
                  Create Booking
                </Button>

              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search bookings..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="icon" variant="outline">
            <SearchIcon className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Car">Car</SelectItem>
              <SelectItem value="Room">Room</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
            </SelectContent>
          </Select> */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <Button variant="ghost" onClick={() => handleSort('id')}>
                  Booking ID {sortBy === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('assetName')}>
                  Asset {sortBy === 'assetName' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('assetType')}>
                  Type {sortBy === 'assetType' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customerName')}>
                  Customer {sortBy === 'customerName' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('startDate')}>
                  Start Date {sortBy === 'startDate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('endDate')}>
                  End Date {sortBy === 'endDate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </Button>
              </TableHead>
              <TableHead>Total Price</TableHead>

              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingList.length > 0 ? (
              bookingList.map((booking) => {
                const statusBadge = getStatusBadge(booking.status || '');
                const StatusIcon = statusBadge.icon;

                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      <CopyableId id={booking.id} />
                    </TableCell>
                    <TableCell>{booking.asset.name}</TableCell>
                    <TableCell>{booking.assetType.name}</TableCell>
                    <TableCell>{booking?.customer?.name}</TableCell>
                    <TableCell>{formatDisplayDate(booking.startDate)}</TableCell>
                    <TableCell>{formatDisplayDate(booking.endDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${booking.totalPrice}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/bookings/booking/${booking.id}`)}
                          title="View booking"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Change status">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, 'Confirmed')}
                              disabled={booking.status === 'Confirmed'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, 'Pending')}
                              disabled={booking.status === 'Pending'}
                            >
                              <Clock className="h-4 w-4 mr-2 text-secondary-foreground" />
                              Set Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, 'Cancelled')}
                              disabled={booking.status === 'Cancelled'}
                            >
                              <XCircle className="h-4 w-4 mr-2 text-destructive" />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(booking)}
                          className={booking.status === 'Cancelled'
                            ? "text-destructive hover:text-destructive"
                            : "text-muted-foreground hover:text-muted-foreground cursor-not-allowed opacity-50"}
                          title={booking.status === 'Cancelled'
                            ? "Delete booking"
                            : "Cancel booking first to delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {paginationMeta && (
        <DataTablePagination
          pagination={paginationMeta}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}
    </>
  );
}
