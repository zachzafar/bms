'use client';

import { useEffect, useState } from 'react';
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

import { isSameDay } from "date-fns";

// Copyable ID Component
function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedId = id.length > 8 ? `${id.slice(0, 8)}...` : id;

  return (
    <div className="flex items-center gap-2 group">
      <span
        className="font-mono text-sm cursor-help"
        title={id}
      >
        {truncatedId}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
        title="Copy full ID"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

// Booking form schema
const bookingFormSchema = z.object({
  assetId: z.string().min(1, { message: 'Asset is required' }),
  startDate: z.date(),
  endDate: z.date(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Helper: calculate nights between two dates
function calculateNights(start: Date | string, end: Date | string) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  return Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// Helper: get status badge variant and icon
function getStatusBadge(status: string) {
  switch (status) {
    case 'Confirmed':
      return { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle };
    case 'Pending':
      return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    case 'Cancelled':
      return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: XCircle };
    default:
      return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800', icon: Clock };
  }
}

type BlockedDate = {
  id: number;
  asset_id: string;
  startDate: Date; // ISO string
  endDate: Date;   // ISO string
  title: string;
  reason?: string;
};


// Helper: find applicable rate for asset and nights
function getApplicableRate(
  assetId: string,
  nights: number,
  rates: {
    assetId: string;
    minNights?: number;
    maxNights?: number;
    pricePerNight?: number;
    priority?: number;
  }[]
) {
  const applicableRates = rates.filter(
    (rate) =>
      rate.assetId === assetId &&
      (!rate.minNights || rate.minNights <= nights) &&
      (!rate.maxNights || rate.maxNights >= nights)
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

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  const [availableAssets, setAvailableAssets] = useState<
    {
      id: string;
      name: string;
      applicableRate?: {
        pricePerNight?: number;
        minNights?: number;
        maxNights?: number;
        priority?: number;
      };
    }[]
  >([]);

  const [dateRangeReady, setDateRangeReady] = useState(false);

  const { data: assets } = authClient.assets.getAssets.useQuery({ queryKey: ['assets'], enabled: !!currentTenant });
  const assetList = assets?.body ?? [];

  const { data: customerResponse } = authClient.users.getCustomers.useQuery({ queryKey: ['customers'] });
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
      minNights?: number;
      maxNights?: number;
      pricePerNight?: number;
      priority?: number;
    }[]
  >([]);

  useEffect(() => {
    if (ratesResponse?.status === 200) {
      const allRates = ratesResponse.body.data.flatMap((item) =>
        item.assetIds.map((assetId) => ({
          ...item.rate,
          assetId,
          minNights: item.rate.minNights ?? undefined,
          maxNights: item.rate.maxNights ?? undefined,
          pricePerNight: item.rate.pricePerNight
            ? Number(item.rate.pricePerNight)
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
    },
  });

  useEffect(() => {
    authClient.booking.getBlockedDates.query({ query: {} })
      .then(res => {
        const blocked: BlockedDate[] = Array.isArray(res.body)
          ? res.body.map(b => ({
            id: b.id,
            asset_id: b.assetId,
            startDate: b.startDate,
            endDate: b.endDate,
            title: b.title,
            reason: b.reason,
          }))
          : [];
        setBlockedDates(blocked);
      })
      .catch(err => console.error(err));
  }, []);

  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  const [invalidStartOrEnd, setInvalidStartOrEnd] = useState<BlockedDate[]>([]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const conflicts = blockedDates.filter(b => {
        const blockedStart = new Date(b.startDate);
        const blockedEnd = new Date(b.endDate);

        // Only global blocks (no specific asset)
        const isGlobalBlock = !b.asset_id || b.asset_id === "null";

        // Overlaps if same day or within range
        const overlaps =
          isSameDay(start, blockedStart) ||
          isSameDay(start, blockedEnd) ||
          isSameDay(end, blockedStart) ||
          isSameDay(end, blockedEnd) ||
          (start <= blockedEnd && end >= blockedStart);

        return overlaps && isGlobalBlock;
      });

      // Only show invalids for global blocks now
      setInvalidStartOrEnd(conflicts);
    } else {
      setInvalidStartOrEnd([]);
    }
  }, [startDate, endDate, blockedDates]);





  // When dates change, fetch available assets and assign applicable rates
  useEffect(() => {
    if (startDate && endDate) {
      setDateRangeReady(true);

      authClient.assets
        .getAvailableAssets.query({
          query: { startDate, endDate },
        })
        .then((res) => {
          if (res.status === 200) {
            const nights = calculateNights(startDate, endDate);

            // Exclude assets that are blocked in that date range
            const blockedAssetIds = blockedDates
              .filter(b => {
                const blockedStart = new Date(b.startDate);
                const blockedEnd = new Date(b.endDate);
                const overlaps =
                  (new Date(startDate) <= blockedEnd && new Date(endDate) >= blockedStart);
                return b.asset_id && b.asset_id !== "null" && overlaps;
              })
              .map(b => b.asset_id);

            const filteredAssets = res.body.data.filter(
              (asset) => !blockedAssetIds.includes(asset.id)
            );

            const assetsWithRates = filteredAssets.map((asset) => {
              const applicableRates = rates.filter(
                (rate) =>
                  rate.assetId === asset.id &&
                  (!rate.minNights || rate.minNights <= nights) &&
                  (!rate.maxNights || rate.maxNights >= nights)
              );

              const selectedRate =
                applicableRates.length > 0
                  ? applicableRates.reduce((prev, curr) =>
                    (prev.priority ?? 100) < (curr.priority ?? 100) ? prev : curr
                  )
                  : null;

              return {
                ...asset,
                applicableRate: selectedRate || undefined,
              };
            });

            setAvailableAssets(assetsWithRates);
          } else {
            setAvailableAssets([]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch available assets:', err);
          setAvailableAssets([]);
        });
    } else {
      setDateRangeReady(false);
      setAvailableAssets([]);
    }
  }, [startDate, endDate, rates, blockedDates]);



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
        onError: (error) => {
          toast.error('Failed to create booking');
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

  const { mutate: cancelBooking } = authClient.booking.cancelBooking.useMutation({
    onSuccess: () => {
      toast.success('Booking canceled.');
      refetch();
    },
    onError: () => {
      toast.error('Failed to cancel booking.');
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

  const handleCancel = (booking: { id: string }) => {
    const confirmed = confirm(`Cancel booking?`);
    if (confirmed) {
      cancelBooking({ params: { id: booking.id }, body: {} });
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
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => {
                    // Convert Date to YYYY-MM-DD and HH:mm for inputs
                    const dateValue = field.value ? new Date(field.value) : null;
                    const datePart = dateValue ? dateValue.toISOString().split('T')[0] : '';
                    const timePart = dateValue ? dateValue.toTimeString().slice(0, 5) : '00:00';

                    return (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={datePart}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              const time = timePart;
                              field.onChange(new Date(`${newDate}T${time}`));
                            }}
                          />
                          <Input
                            type="time"
                            value={timePart}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              const date = datePart || new Date().toISOString().split('T')[0];
                              field.onChange(new Date(`${date}T${newTime}`));
                            }}
                          />
                        </div>

                        {invalidStartOrEnd.length > 0 && (
                          <div className="mt-2 p-2 border border-red-300 bg-red-50 rounded">
                            <p className="font-semibold text-red-700">
                              The start or end date cannot be on these blocked dates:
                            </p>
                            <ul className="list-disc ml-5 text-red-600 text-sm">
                              {invalidStartOrEnd.map(b => {
                                const start = new Date(b.startDate);
                                const end = new Date(b.endDate);
                                return (
                                  <li key={b.id}>
                                    {b.title} ({start.toLocaleDateString()} → {end.toLocaleDateString()})
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => {
                    // Convert Date to YYYY-MM-DD and HH:mm for inputs
                    const dateValue = field.value ? new Date(field.value) : null;
                    const datePart = dateValue ? dateValue.toISOString().split('T')[0] : '';
                    const timePart = dateValue ? dateValue.toTimeString().slice(0, 5) : '00:00';

                    return (
                      <FormItem>
                        <FormLabel>End Date & Time</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={datePart}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              const time = timePart;
                              field.onChange(new Date(`${newDate}T${time}`));
                            }}
                          />
                          <Input
                            type="time"
                            value={timePart}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              const date = datePart || new Date().toISOString().split('T')[0];
                              field.onChange(new Date(`${date}T${newTime}`));
                            }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Customers
                  </label>

                  <MultiSelector values={customers} onValuesChange={setCustomers}>
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
                </div>
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select
                        disabled={!dateRangeReady}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                dateRangeReady
                                  ? 'Select an available asset'
                                  : 'Select dates first'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.name}
                              {asset.applicableRate?.pricePerNight !== undefined
                                ? ` - $${asset.applicableRate.pricePerNight.toFixed(
                                  2
                                )} per night`
                                : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={invalidStartOrEnd.length > 0}>
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Car">Car</SelectItem>
              <SelectItem value="Room">Room</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
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

              {/* New columns */}
              <TableHead>Rate / Night</TableHead>
              <TableHead>Total Price</TableHead>

              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingList.length > 0 ? (
              bookingList.map((booking) => {
                const nights = calculateNights(booking.startDate, booking.endDate);
                const rate = getApplicableRate(booking.asset.id, nights, rates);
                const pricePerNight = rate?.pricePerNight ?? 0;
                const totalPrice = pricePerNight * nights;

                const statusBadge = getStatusBadge(booking.status || '');
                const StatusIcon = statusBadge.icon;

                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      <CopyableId id={booking.id} />
                    </TableCell>
                    <TableCell>{booking.asset.name}</TableCell>
                    <TableCell>{booking.asset.assetTypeId}</TableCell>
                    <TableCell>{booking.customer.id}</TableCell>
                    <TableCell>{new Date(booking.startDate).toISOString().split('T')[0]}</TableCell>
                    <TableCell>{new Date(booking.endDate).toISOString().split('T')[0]}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {booking.status}
                      </Badge>
                    </TableCell>

                    <TableCell>${pricePerNight.toFixed(2)}</TableCell>
                    <TableCell>${totalPrice.toFixed(2)}</TableCell>

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
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, 'Pending')}
                              disabled={booking.status === 'Pending'}
                            >
                              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                              Set Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, 'Cancelled')}
                              disabled={booking.status === 'Cancelled'}
                            >
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancel(booking)}
                          className="text-destructive hover:text-destructive"
                          title="Delete booking"
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
