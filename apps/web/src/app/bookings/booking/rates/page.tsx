"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/api/publicClient";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ASSET_TYPE_QUERY_KEY, ASSETS_QUERY_KEY, RATES_QUERY_KEY } from "@/lib/api/queryKeys";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SelectionMode = "assets" | "assetType";

const rateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  minNights: z.coerce.number(),
  maxNights: z.coerce.number(),
  assetTypeId: z.coerce.number().optional(),
  pricePerNight: z.coerce.number().optional(),
  assetIds: z.array(z.string()),
});

type RateFormValues = z.infer<typeof rateSchema>;

const defaultFormValues: Partial<RateFormValues> = {
  name: '',
  description: '',
  startDate: undefined,
  endDate: undefined,
  minNights: 0,
  maxNights: 0,
  pricePerNight: 0,
  assetTypeId: undefined,
  assetIds: [],
};

export default function RatesPage() {
  const { data: rateData, refetch } = authClient.rates.getRates.useQuery({ queryKey: RATES_QUERY_KEY });
  const { mutate: createRate } = authClient.rates.createRate.useMutation();
  const { mutate: updateRate } = authClient.rates.updateRate.useMutation();
  const { mutate: deleteRate } = authClient.rates.deleteRate.useMutation();
  const [assetSearch, setAssetSearch] = useState('');
  const { data: assetsResponse } = authClient.assets.getAssets.useQuery({
    queryKey: [ASSETS_QUERY_KEY, assetSearch],
    queryData: {
      query: {
        search: assetSearch || undefined,
      },
    },
  });
  const { data: assetTypesResponse } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: [ASSET_TYPE_QUERY_KEY]
  });
  const rates = rateData?.body.data ?? [];
  const assets = assetsResponse?.body.data ?? [];
  const assetTypes = assetTypesResponse?.body.data ?? [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("assets");
  

  const form = useForm<RateFormValues>({
    defaultValues: defaultFormValues,
  });

  const handleSelectionModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);
    if (mode === "assets") {
      form.setValue("assetTypeId", undefined);
    } else {
      form.setValue("assetIds", []);
    }
  };

  const handleSubmit = (values: RateFormValues) => {
    if (!values.name || values.name.trim() === "") {
      toast.error("Name is required");
      return;
    }

    if (!values.startDate || !values.endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    if (selectionMode === "assets" && (!values.assetIds || values.assetIds.length === 0)) {
      toast.error("Please select at least one asset");
      return;
    }

    if (selectionMode === "assetType" && !values.assetTypeId) {
      toast.error("Please select an asset type");
      return;
    }

    const basePayload = {
      name: values.name,
      description: values.description,
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      minNights: values.minNights,
      maxNights: values.maxNights,
      pricePerNight: values.pricePerNight !== undefined ? String(values.pricePerNight) : undefined,
    };

    const resetState = () => {
      setEditingRateId(null);
      form.reset(defaultFormValues);
      setSelectionMode("assets");
      setAssetSearch('');
      setIsDialogOpen(false);
    };

    if (editingRateId) {
      const updatePayload = selectionMode === "assetType"
        ? { ...basePayload, assetTypeIds: values.assetTypeId ? [values.assetTypeId] : [], assetIds: [] }
        : { ...basePayload, assetIds: values.assetIds, assetTypeIds: [] };

      updateRate(
        {
          params: { id: editingRateId },
          body: { ...updatePayload, id: editingRateId },
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
      const createPayload = selectionMode === "assetType"
        ? { ...basePayload, assetTypeId: values.assetTypeId, assetIds: [] as string[] }
        : { ...basePayload, assetIds: values.assetIds };

      createRate(
        { body: createPayload },
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

  const handleEdit = (rate: any, assetIds: string[], assetTypeIds: number[]) => {
    const hasAssetType = assetTypeIds && assetTypeIds.length > 0;
    const mode: SelectionMode = hasAssetType ? "assetType" : "assets";
    setSelectionMode(mode);
    setAssetSearch('');

    form.reset({
      name: rate.name,
      description: rate.description ?? "",
      startDate: new Date(rate.startDate),
      endDate: new Date(rate.endDate),
      minNights: rate.minNights ?? undefined,
      maxNights: rate.maxNights ?? undefined,
      pricePerNight: rate.pricePerNight ?? undefined,
      assetTypeId: hasAssetType ? assetTypeIds[0] : undefined,
      assetIds: hasAssetType ? [] : assetIds,
    });
    setEditingRateId(rate.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this rate?')) {
      deleteRate(
        {
          params: { id },
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

  const onCreateClick = () => {
    form.reset(defaultFormValues);
    setSelectionMode("assets");
    setEditingRateId(null);
    setAssetSearch('');
    setIsDialogOpen(true);
  };

  const getAssetTypeName = (id: number) => {
    const assetType = assetTypes.find((at: any) => at.id === id);
    return assetType?.name ?? "";
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRateId ? 'Edit Rate' : 'Create Rate'}</DialogTitle>
              <DialogDescription>Enter rate details below</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
              >
                <div className="md:col-span-2 space-y-4">
                  <Label>Apply rate to</Label>
                  <RadioGroup
                    value={selectionMode}
                    onValueChange={(value) => handleSelectionModeChange(value as SelectionMode)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="assets" id="assets" />
                      <Label htmlFor="assets" className="font-normal cursor-pointer">
                        Specific Assets
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="assetType" id="assetType" />
                      <Label htmlFor="assetType" className="font-normal cursor-pointer">
                        Asset Type
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {selectionMode === "assets" ? (
                  <FormField
                    control={form.control}
                    name="assetIds"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Assets</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              placeholder="Search assets..."
                              value={assetSearch}
                              onChange={(e) => setAssetSearch(e.target.value)}
                            />
                            <div className="flex flex-col gap-1 border rounded p-2 max-h-40 overflow-y-auto">
                              {assets.length > 0 ? (
                                assets.map((asset: any) => (
                                  <label key={asset.id} className="flex items-center gap-2 cursor-pointer">
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
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">No assets found</span>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="assetTypeId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Asset Type</FormLabel>
                        <Select
                          value={field.value?.toString() ?? ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an asset type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assetTypes.map((assetType: any) => (
                              <SelectItem key={assetType.id} value={assetType.id.toString()}>
                                {assetType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {['name', 'description', 'startDate', 'endDate', 'minNights', 'maxNights', 'pricePerNight'].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof RateFormValues}
                    render={({ field }) => {
                      const isDateField = ['startDate', 'endDate'].includes(fieldName);
                      const value = isDateField && field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : field.value;

                      return (
                        <FormItem>
                          <FormLabel>{fieldName}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={value as string}
                              type={isDateField ? 'date' : 'text'}
                              onChange={(e) => {
                                if (isDateField) {
                                  field.onChange(new Date(e.target.value));
                                } else {
                                  field.onChange(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
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
              <TableHead>Applies To</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Price/Night</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates?.length ? (
              rates.map((item: any) => {
                const rate = item.rate;
                const assetIds = item.assetIds || [];
                const assetTypeIds = item.assetTypeIds || [];

                const appliesTo = assetTypeIds.length > 0
                  ? `Type: ${assetTypeIds.map((id: number) => getAssetTypeName(id)).join(", ")}`
                  : assets
                      .filter((a: any) => assetIds.includes(String(a.id)))
                      .map((a: any) => a.name)
                      .join(", ") || "—";

                return (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.name}</TableCell>
                    <TableCell>{appliesTo}</TableCell>
                    <TableCell>{toDateInputFormat(rate.startDate)}</TableCell>
                    <TableCell>{toDateInputFormat(rate.endDate)}</TableCell>
                    <TableCell>{rate.pricePerNight}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rate, assetIds, assetTypeIds)}
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
                <TableCell colSpan={6}>No rates found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
