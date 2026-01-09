'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import { BOOKINGS_QUERY_KEY } from '@/lib/api/queryKeys';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';

const BookingSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  status: z.string().default('confirmed').optional(),
});

type BookingForm = z.infer<typeof BookingSchema>;

export default function Bookings({ userId }: { userId: string }) {
  const tenant = StorageService.getTenant();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEditId, setOpenEditId] = useState<string | null>(null);

  const { data: bookingsData, isLoading: bookingsLoading } = authClient.booking.getBookings.useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    enabled: !!tenant,
  });
  const { data: assetsData } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets'],
    enabled: !!tenant,
  });
  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
    enabled: !!tenant,
  });

  const bookings = bookingsData?.body.data ?? [];
  const assets = assetsData?.body.data ?? [];
  const customers = customersData?.body.data ?? [];
  const selectedCustomer = useMemo(() => customers.find((c: any) => c.user.id === userId), [customers, userId]);
  const customerIdNum = selectedCustomer?.customer?.id;

  const customerBookings = useMemo(() => bookings.filter((b: any) => b.user?.id === userId), [bookings, userId]);

  const { mutate: createBooking, isPending: creating } = authClient.booking.createBooking.useMutation();
  const { mutate: updateBooking, isPending: updating } = authClient.booking.updateBooking.useMutation();
  const { mutate: cancelBooking, isPending: cancelling } = authClient.booking.cancelBooking.useMutation();
  const queryClient = authClient.useQueryClient();

  const createForm = useForm<BookingForm>({
    resolver: zodResolver(BookingSchema),
    defaultValues: { status: 'confirmed' },
  });

  const editForm = useForm<BookingForm>({
    resolver: zodResolver(BookingSchema),
  });

  if (bookingsLoading) return <Loading />;

  const submitCreate = (values: BookingForm) => {
    if (!customerIdNum) {
      toast.error('Customer ID not found');
      return;
    }
    createBooking(
      {
        body: {
          booking: {
            assetId: values.assetId,
            startDate: new Date(values.startDate),
            endDate: new Date(values.endDate),
            status: values.status || 'confirmed',
          },
          customers: [customerIdNum],
        },
      },
      {
        onSuccess: () => {
          toast.success('Booking created');
          queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
          setOpenCreate(false);
          createForm.reset();
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to create booking');
        },
      }
    );
  };

  const submitUpdate = (bookingId: string, values: BookingForm) => {
    updateBooking(
      {
        params: { id: bookingId },
        body: {
          assetId: values.assetId,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          status: values.status || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success('Booking updated');
          queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
          setOpenEditId(null);
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to update booking');
        },
      }
    );
  };

  const handleDelete = (bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    cancelBooking(
      { params: { id: bookingId }, body: {} },
      {
        onSuccess: () => {
          toast.success('Booking cancelled');
          queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to cancel booking');
        },
      }
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <CardTitle className="text-base">Bookings</CardTitle>
        <Button onClick={() => setOpenCreate(true)}><Plus className="h-4 w-4 mr-2" />Add Booking</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Customer Bookings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Booking ID</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerBookings.length > 0 ? (
                customerBookings.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.id}</TableCell>
                    <TableCell>{b.asset?.name ?? '-'}</TableCell>
                    <TableCell>{new Date(b.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(b.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{b.status}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setOpenEditId(String(b.id));
                        editForm.reset({
                          assetId: b.asset?.id ?? '',
                          startDate: new Date(b.startDate).toISOString().split('T')[0],
                          endDate: new Date(b.endDate).toISOString().split('T')[0],
                          status: b.status,
                        });
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(String(b.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Booking</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                        <SelectContent>
                          {assets.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>Create</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!openEditId} onOpenChange={(v) => !v && setOpenEditId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Booking</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((vals) => submitUpdate(openEditId!, vals))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                        <SelectContent>
                          {assets.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenEditId(null)}>Cancel</Button>
                <Button type="submit" disabled={updating}>Save</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}