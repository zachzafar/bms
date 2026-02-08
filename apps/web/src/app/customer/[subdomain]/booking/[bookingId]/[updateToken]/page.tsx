'use client';

import { useParams, useRouter } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDateForInput, parseDateInputAsUTC, formatDisplayDate } from '@/lib/utils/date';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UpdateBookingSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type UpdateBookingFormData = z.infer<typeof UpdateBookingSchema>;

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const bookingId = params.bookingId as string;
  const updateToken = params.updateToken as string;

  const [success, setSuccess] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const { data: bookingResponse, isLoading, error: queryError } = client.booking.customerViewBooking.useQuery({
    queryKey: ['booking', bookingId],
    queryData: {
      params: {  bookingId, token: updateToken },
    },
  });

  const booking = bookingResponse?.status === 200 ? bookingResponse.body : null;

  const form = useForm<UpdateBookingFormData>({
    resolver: zodResolver(UpdateBookingSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
    },
  });

  // Initialize form data when booking is loaded
  useEffect(() => {
    if (booking) {
      form.reset({
        startDate: formatDateForInput(booking.startDate),
        endDate: formatDateForInput(booking.endDate),
      });
    }
  }, [booking, form]);

  const { mutate: updateBookingMutation, isPending } = client.booking.updateBookingByToken.useMutation();
  const { mutate: cancelBookingMutation, isPending: isCancelling } = client.booking.cancelBookingByToken.useMutation();

  const handleCancelBooking = () => {
    cancelBookingMutation(
      {
        params: {
          token: updateToken,
          bookingId: bookingId,
        },
        body: {},
      },
      {
        onSuccess: (response) => {
          if (response.status === 200) {
            setCancelled(true);
            toast.success('Booking cancelled successfully! Check your email for confirmation.');
          } else if (response.status === 403) {
            toast.error('This cancellation link has expired or is invalid. Please contact support.');
          } else {
            toast.error('Failed to cancel booking. Please try again.');
          }
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to cancel booking. Please try again.');
          console.error(err);
        },
      }
    );
  };

  const onSubmit = (data: UpdateBookingFormData) => {
    if (!booking) return;

    updateBookingMutation(
      {
        params: {
          token: updateToken,
          bookingId: bookingId,
        },
        body: {
          id: bookingId,
          assetId: booking.asset.id,
          startDate: parseDateInputAsUTC(data.startDate),
          endDate: parseDateInputAsUTC(data.endDate),
          status: booking.status ?? 'confirmed',
          totalPrice: booking.totalPrice ?? '0',
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 200) {
            setSuccess(true);
            toast.success('Booking updated successfully! Check your email for confirmation.');
          } else if (response.status === 403) {
            toast.error('This update link has expired or is invalid. Please contact support.');
          } else {
            toast.error('Failed to update booking. Please try again.');
          }
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to update booking. Please try again.');
          console.error(err);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (queryError || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Booking Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find the booking you're trying to update. The link may be invalid or expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Booking Cancelled</h2>
              <p className="text-muted-foreground mb-6">
                Your booking has been successfully cancelled. You'll receive a confirmation email shortly.
              </p>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  If you cancelled by mistake, please contact us directly to rebook.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Booking Updated!</h2>
              <p className="text-muted-foreground mb-6">
                Your booking has been successfully updated. You'll receive a confirmation email with the new details.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">Updated Booking Details</p>
                <p className="text-sm text-muted-foreground">
                  {formatDisplayDate(parseDateInputAsUTC(form.getValues('startDate')), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground mb-1">to</p>
                <p className="text-sm text-muted-foreground">
                  {formatDisplayDate(parseDateInputAsUTC(form.getValues('endDate')), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Update Your Booking</CardTitle>
                <CardDescription>Modify your reservation dates below</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Current Booking Information */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Current Booking Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-medium text-foreground">{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset:</span>
                  <span className="font-medium text-foreground">{booking.asset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-foreground">{booking.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price:</span>
                  <span className="font-medium text-foreground">${booking.totalPrice}</span>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Start Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
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
                        <FormLabel>New End Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={form.watch('startDate') || new Date().toISOString().split('T')[0]}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Warning Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Please note:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Changing your dates may affect the total price</li>
                        <li>New dates are subject to availability</li>
                        <li>You'll receive an updated confirmation email</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isPending || isCancelling}
                    className="flex-1"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Update Booking
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isPending || isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Booking
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your booking for <strong>{booking.asset.name}</strong>.
                          This action cannot be undone. You'll need to create a new booking if you change your mind.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelBooking}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Yes, Cancel Booking
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  * Required fields
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}