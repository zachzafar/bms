'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectAsset } from '@repo/api-contract';
import { authClient } from '@/lib/api/publicClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { InsertAvailabilitySchema, InsertAvailability } from '@repo/api-contract';

export default function AssetAvailabilityCalendar({
  asset }: { asset: SelectAsset }) {
    const queryClient = authClient.useQueryClient();
  
    const { data: availabilities } = authClient.booking.getAssetAvailability.useQuery({
    queryKey: ['availability', asset.id],
    queryData: { params: { id: asset.id } }
  });

  const { mutate } = authClient.booking.createAssetAvailability.useMutation();

  const ranges = availabilities?.status == 200 ? availabilities.body.map(availability => availability) : [];

  const form = useForm<InsertAvailability>({
    resolver: zodResolver(InsertAvailabilitySchema),
    defaultValues: {
      available: false,
    },
  });

  const onSubmit = (data: InsertAvailability) => {
    console.log("submiting")
    const newRange = {
      startDate: data.startDate,
      endDate: data.endDate,
      price: data.price,
      available: !data.available,
      assetId: asset.id
    };

    mutate(
      { body: newRange },
      {
        onSuccess: () => {
          toast.success('Availability added successfully');
          queryClient.invalidateQueries({ queryKey: ['availability', asset.id]});
          form.reset();
        },
        onError: (error) => {
          toast.error('Failed to add availability');
          console.error(error);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
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
                        <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per day</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mr-2"
                      />
                    </FormControl>
                    <FormLabel>Block these dates</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Add Range
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability Ranges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.map((range, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(range.startDate).toLocaleDateString()} - {new Date(range.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{range.available ? 'Available' : 'Blocked'}</TableCell>
                  <TableCell>{range.price ? `$${range.price}/day` : 'No price set'}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Add delete mutation here
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}