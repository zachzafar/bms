'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectAsset } from '@repo/api-contract';
import { authClient } from '@/lib/api/publicClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { z } from 'zod';

const InsertAvailabilitySchema = z.object({
            assetId: z.string(),
            startDate: z.date(),
            endDate: z.date(),
            available: z.boolean(),
            price: z.string(),
})

type InsertAvailability = z.infer<typeof InsertAvailabilitySchema>;

export default function AssetAvailabilityCalendar({
  asset }: { asset: SelectAsset }) {
    const queryClient = authClient.useQueryClient();
  
    const { data: availabilities } = authClient.slots.getAssetAvailability.useQuery({
    queryKey: ['availability', asset.id],
    queryData: { params: { id: asset.id } }
  });

  const { mutate } = authClient.slots.createAssetAvailability.useMutation();

  const ranges = availabilities?.status == 200 ? availabilities.body.map(availability => availability) : [];

  const form = useForm<Omit<InsertAvailability,"assetId">>({
    resolver: zodResolver(InsertAvailabilitySchema.omit({ assetId: true })),
    defaultValues: {
      available: false,
    },
  });

  const onSubmit = (data: Omit<InsertAvailability,"assetId">) => {
    console.log("submiting")
    const newRange = {
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
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
        onError: (error: any) => {
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
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
               Start of Asset Availability
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

<FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                End of asset availability
              </FormDescription>
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