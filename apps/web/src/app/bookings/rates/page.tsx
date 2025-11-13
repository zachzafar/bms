"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/api/publicClient";
import { rateContract } from "@repo/api-contract";

import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ASSETS_QUERY_KEY, RATES_QUERY_KEY } from "@/lib/api/queryKeys";

const rateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  minNights: z.coerce.number().optional(),
  maxNights: z.coerce.number().optional(),
  pricePerNight: z.coerce.number().optional(),
  // priority: z.coerce.number().default(100),
  assetIds: z.array(z.string()).optional(), // optional bulk assign
});

type RateFormValues = z.infer<typeof rateSchema>;

const defaultFormValues: RateFormValues = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  minNights: undefined,
  maxNights: undefined,
  pricePerNight: undefined,
  // priority: 100,
  assetIds: [],
};

export default function RatesPage() {
  const queryClient = authClient.useQueryClient();
  const { data: rateData, refetch } = authClient.rates.getRates.useQuery({ queryKey: RATES_QUERY_KEY });
  const { mutate: createRate } = authClient.rates.createRate.useMutation();
  const { mutate: updateRate } = authClient.rates.updateRate.useMutation();
  const { mutate: deleteRate } = authClient.rates.deleteRate.useMutation();
  const { data: assetsResponse } = authClient.assets.getAssets.useQuery({ queryKey: ASSETS_QUERY_KEY });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);

  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: defaultFormValues,
  });

  const handleSubmit = (values: RateFormValues) => {
    if (!values.startDate || !values.endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    const payload = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      pricePerNight: values.pricePerNight !== undefined ? String(values.pricePerNight) : undefined,
    };

    const resetState = () => {
      setEditingRateId(null);
      form.reset(defaultFormValues);
      setIsDialogOpen(false);
    };

    if (editingRateId) {
      updateRate(
        {
          params: { id: String(editingRateId) },
          body: { ...payload, id: editingRateId },
        },
        {
          onSuccess: () => {
            toast.success('Rate updated');
            refetch();
            resetState();
          },
          onError: () => {
            toast.error("Failed to update rate");
          },
        }
      );
    } else {
      createRate(
        { body: payload },
        {
          onSuccess: () => {
            toast.success('Rate created');
            refetch();
            resetState();
          },
          onError: () => {
            toast.error("Failed to create rate");
          },
        }
      );
    }
  };

  function toDateInputFormat(dateStr: string) {
    return dateStr ? dateStr.slice(0, 10) : '';
  }

  const handleEdit = (rate: any, assetIds: string[]) => {
    form.reset({
      name: rate.name,
      description: rate.description ?? "",
      startDate: toDateInputFormat(rate.startDate),
      endDate: toDateInputFormat(rate.endDate),
      minNights: rate.minNights ?? undefined,
      maxNights: rate.maxNights ?? undefined,
      pricePerNight: rate.pricePerNight ?? undefined,
      // priority: rate.priority ?? 100,
      assetIds,
    });
    setEditingRateId(rate.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this rate?')) {
      deleteRate(
        {
          params: { id: String(id) },
          body: undefined,
        },
        {
          onSuccess: () => {
            toast.success('Rate deleted');
            refetch();
          },
        }
      );
    }
  };

  // NEW: on create button click, reset form to default values explicitly to clear old data
  const onCreateClick = () => {
    form.reset(defaultFormValues);  // Reset with default values
    setEditingRateId(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rates</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={onCreateClick}>
              Create Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRateId ? 'Edit Rate' : 'Create Rate'}</DialogTitle>
              <DialogDescription>Enter rate details below</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
              >
                <FormField
                  control={form.control}
                  name="assetIds"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Assets</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-1 border rounded p-2 max-h-40 overflow-y-auto">
                          {assetsResponse?.body.map((asset: any) => (
                            <label key={asset.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                value={String(asset.id)}
                                checked={field.value?.includes(String(asset.id)) || false}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  const updated = isChecked
                                    ? [...(field.value || []), String(asset.id)]
                                    : (field.value || []).filter((id) => id !== String(asset.id));
                                  field.onChange(updated);
                                }}
                              />
                              {asset.name}
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {['name', 'description', 'startDate', 'endDate', 'minNights', 'maxNights', 'pricePerNight'].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof RateFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldName}</FormLabel>
                        <FormControl>
                          <Input {...field} type={['startDate', 'endDate'].includes(fieldName) ? 'date' : 'text'} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="submit" className="w-full md:col-span-2">
                  {editingRateId ? 'Update Rate' : 'Create Rate'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Price/Night</TableHead>
              {/* <TableHead>Priority</TableHead> */}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateData?.body?.length ? (
              rateData.body.map((item: any) => {
                const rate = item.rate;
                const assetIds = item.assetIds || [];

                return (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.name}</TableCell>
                    <TableCell>
                      {(assetsResponse?.body || [])
                        .filter((a) => assetIds.includes(String(a.id)))
                        .map((a) => a.name)
                        .join(", ")}
                    </TableCell>
                    <TableCell>{toDateInputFormat(rate.startDate)}</TableCell>
                    <TableCell>{toDateInputFormat(rate.endDate)}</TableCell>
                    <TableCell>{rate.pricePerNight}</TableCell>
                    {/* <TableCell>{rate.priority}</TableCell> */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rate, assetIds)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(rate.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7}>No rates found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
