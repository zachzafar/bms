'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Loading from '@/components/custom/Loading';
import { authClient } from '@/lib/api/publicClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Calendar, User, DollarSign, MapPin, Phone, Mail, Edit } from 'lucide-react';
import { formatDisplayDate, formatDateForInput, parseDateInputAsUTC } from '@/lib/utils/date';

type BookingFormData = {
  form: {
    id: number;
    name: string;
    description: string | null;
  };
  fields: Array<{
    id: number;
    name: string;
    type: string;
    required: boolean;
    placeholder: string | null;
    helpText: string | null;
  }>;
  assignmentType: 'direct' | 'assetType' | 'tag';
};

const UpdateBookingSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['Pending', 'Confirmed', 'Cancelled']),
  totalPrice: z.string().optional(),
});

type UpdateBookingForm = z.infer<typeof UpdateBookingSchema>;

export default function BookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const queryClient = authClient.useQueryClient();

  // Fetch booking details
  const { data: bookingData, isLoading } = authClient.booking.getBooking.useQuery({
    queryKey: ['booking', bookingId],
    queryData: {
      params: { id: bookingId },
    }
  });

  // Asset search and filter state
  const [assetSearch, setAssetSearch] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<number | undefined>(undefined);

  // Fetch asset types for filtering
  const { data: assetTypesResponse } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['asset-types'],
  });
  const assetTypes = assetTypesResponse?.body?.data ?? [];

  // Fetch all assets for the dropdown with search and filter
  const { data: assetsData } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets', assetSearch, assetTypeFilter],
    queryData: {
      query: {
        search: assetSearch || undefined,
        assetTypeId: assetTypeFilter,
      },
    },
  });
  const assetList = assetsData?.body?.data ?? [];

  // Fetch forms for the asset
  const { data: formsData } = authClient.settings.form.getFormsForAsset.useQuery({
    queryKey: ['forms-for-asset', bookingData?.body?.asset?.id],
    queryData: {
      params: { assetId: bookingData?.body?.asset?.id ?? '' },
    },
    enabled: !!bookingData?.body?.asset?.id,
  });

  const { mutate: updateBooking, isPending: isUpdating } = authClient.booking.updateBooking.useMutation();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = authClient.booking.updateBookingStatus.useMutation();

  const booking = bookingData?.body;
  const forms = formsData?.body?.forms ?? [];

  const form = useForm<UpdateBookingForm>({
    resolver: zodResolver(UpdateBookingSchema),
    defaultValues: {
      assetId: booking?.assetId ?? '',
      startDate: booking?.startDate ? formatDateForInput(booking.startDate) : '',
      endDate: booking?.endDate ? formatDateForInput(booking.endDate) : '',
      status: booking?.status ?? 'Pending',
      totalPrice: booking?.totalPrice ?? '',
    },
    values: {
      assetId: booking?.assetId ?? '',
      startDate: booking?.startDate ? formatDateForInput(booking.startDate) : '',
      endDate: booking?.endDate ? formatDateForInput(booking.endDate) : '',
      status: booking?.status ?? 'Pending',
      totalPrice: booking?.totalPrice ?? '',
    }
  });

  if (isLoading || !booking) return <Loading />;

  const onSubmitUpdate = (values: UpdateBookingForm) => {
    updateBooking(
      {
        params: { id: bookingId },
        body: {
          id: bookingId,
          startDate: parseDateInputAsUTC(values.startDate),
          endDate: parseDateInputAsUTC(values.endDate),
          status: values.status,
          totalPrice: values.totalPrice || booking.totalPrice,
          assetId: values.assetId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Booking updated successfully');
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
          setEditDialogOpen(false);
        },
        onError: (error) => {
          console.error(error);
          toast.error('Failed to update booking');
        },
      }
    );
  };

  const onUpdateStatus = (newStatus: 'Pending' | 'Confirmed' | 'Cancelled') => {
    updateStatus(
      {
        params: { id: bookingId },
        body: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Booking status updated to ${newStatus}`);
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
          setStatusDialogOpen(false);
        },
        onError: (error) => {
          console.error(error);
          toast.error('Failed to update status');
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
      case 'Pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
    }
  };

  const formatFormResponseValue = (value: string, fieldType: string) => {
    if (!value) return '-';

    // Handle date_range type
    if (fieldType === 'date_range') {
      try {
        const parsed = JSON.parse(value);
        if (parsed.start && parsed.end) {
          return `${formatDisplayDate(parsed.start)} - ${formatDisplayDate(parsed.end)}`;
        }
      } catch {
        return value;
      }
    }

    // Handle date type
    if (fieldType === 'date') {
      try {
        return formatDisplayDate(value);
      } catch {
        return value;
      }
    }

    // Handle boolean type
    if (fieldType === 'boolean') {
      return value === 'true' ? 'Yes' : 'No';
    }

    // Default: return as-is
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg md:text-2xl">Booking Details</h1>
          <p className="text-sm text-muted-foreground">ID: {bookingId}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
            Update Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Booking
          </Button>
        </div>
      </div>

      {/* Booking Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dates & Asset */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Booking Period</div>
                <div className="font-medium">
                  {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Asset</div>
                <div className="font-medium">{booking.asset?.name || '-'}</div>
                {booking.asset?.description && (
                  <div className="text-sm text-muted-foreground">{booking.asset.description}</div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Total Price</div>
                <div className="font-medium">${booking.totalPrice || '0.00'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{booking.customer?.name || '-'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{booking.customer?.email || '-'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{booking.customer?.phone || '-'}</div>
              </div>
            </div>
            {booking.customer?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium">{booking.customer.address}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Responses */}
      {booking.formResponses && booking.formResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Form Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.formResponses.map((response) => (
              <div key={response.id} className="border-b last:border-0 pb-3 last:pb-0">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {response.fieldName}
                </div>
                <div className="font-medium">
                  {formatFormResponseValue(response.value, response.fieldType)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Booking Forms (Available Forms) */}
      {/* {forms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Booking Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {forms.map((formData: BookingFormData) => (
              <div key={formData.form.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{formData.form.name}</h3>
                {formData.form.description && (
                  <p className="text-sm text-muted-foreground mb-4">{formData.form.description}</p>
                )}
                <div className="space-y-3">
                  {formData.fields.map((field: BookingFormData['fields'][0]) => (
                    <div key={field.id} className="space-y-1">
                      <div className="text-sm font-medium">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      {field.helpText && (
                        <div className="text-xs text-muted-foreground">{field.helpText}</div>
                      )}
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground italic">
                  Form responses will be displayed here once the functionality is implemented
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )} */}

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-4">
              {/* Asset Selection */}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current status: <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            </p>
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onUpdateStatus('Pending')}
                disabled={isUpdatingStatus || booking.status === 'Pending'}
              >
                Mark as Pending
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onUpdateStatus('Confirmed')}
                disabled={isUpdatingStatus || booking.status === 'Confirmed'}
              >
                Mark as Confirmed
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onUpdateStatus('Cancelled')}
                disabled={isUpdatingStatus || booking.status === 'Cancelled'}
              >
                Mark as Cancelled
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
