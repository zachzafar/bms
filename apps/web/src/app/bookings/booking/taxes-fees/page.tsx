"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/api/publicClient";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { TAXES_FEES_QUERY_KEY } from "@/lib/api/queryKeys";
import { Badge } from "@/components/ui/badge";

const taxFeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["tax", "fee"]),
  calculationType: z.enum(["percentage", "fixed_per_unit", "fixed_flat"]),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater"),
  calculationBasis: z.enum(["net", "gross"]),
  maxUnits: z.coerce.number().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortOrder: z.coerce.number(),
  isActive: z.boolean(),
});

type TaxFeeFormValues = z.infer<typeof taxFeeSchema>;

const defaultFormValues: TaxFeeFormValues = {
  name: "",
  description: "",
  type: "tax",
  calculationType: "percentage",
  rate: 0,
  calculationBasis: "net",
  maxUnits: undefined,
  minAmount: undefined,
  maxAmount: undefined,
  sortOrder: 0,
  isActive: true,
};

export default function TaxesFeesPage() {
  const { data: taxFeeData, refetch } = authClient.taxesFees.getTaxFees.useQuery({
    queryKey: TAXES_FEES_QUERY_KEY,
    queryData: { query: { page: 1, pageSize: 100 } },
  });
  const { mutate: createTaxFee } = authClient.taxesFees.createTaxFee.useMutation();
  const { mutate: updateTaxFee } = authClient.taxesFees.updateTaxFee.useMutation();
  const { mutate: deleteTaxFee } = authClient.taxesFees.deleteTaxFee.useMutation();

  const taxFees = taxFeeData?.body?.data ?? [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<TaxFeeFormValues>({
    defaultValues: defaultFormValues,
  });

  const watchCalculationType = form.watch("calculationType");

  const handleSubmit = (values: TaxFeeFormValues) => {
    const payload: any = {
      name: values.name,
      description: values.description || undefined,
      type: values.type,
      calculationType: values.calculationType,
      rate: values.rate.toString(),
      calculationBasis: values.calculationBasis,
      maxUnits: values.calculationType === "fixed_per_unit" && values.maxUnits ? values.maxUnits : null,
      minAmount: values.minAmount ? values.minAmount.toString() : null,
      maxAmount: values.maxAmount ? values.maxAmount.toString() : null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    };

    const resetState = () => {
      setEditingId(null);
      form.reset(defaultFormValues);
      setIsDialogOpen(false);
    };

    if (editingId) {
      updateTaxFee(
        { params: { id: editingId }, body: payload },
        {
          onSuccess: () => {
            toast.success("Tax/fee updated");
            refetch();
            resetState();
          },
          onError: () => toast.error("Failed to update tax/fee"),
        }
      );
    } else {
      createTaxFee(
        { body: payload },
        {
          onSuccess: () => {
            toast.success("Tax/fee created");
            refetch();
            resetState();
          },
          onError: () => toast.error("Failed to create tax/fee"),
        }
      );
    }
  };

  const handleEdit = (tf: any) => {
    form.reset({
      name: tf.name,
      description: tf.description ?? "",
      type: tf.type,
      calculationType: tf.calculationType,
      rate: tf.rate ? Number(tf.rate) : 0,
      calculationBasis: tf.calculationBasis,
      maxUnits: tf.maxUnits ?? undefined,
      minAmount: tf.minAmount ? Number(tf.minAmount) : undefined,
      maxAmount: tf.maxAmount ? Number(tf.maxAmount) : undefined,
      sortOrder: tf.sortOrder ?? 0,
      isActive: tf.isActive,
    });
    setEditingId(tf.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this tax/fee?")) {
      deleteTaxFee(
        { params: { id }, body: undefined },
        {
          onSuccess: () => {
            toast.success("Tax/fee deleted");
            refetch();
          },
          onError: () => toast.error("Failed to delete tax/fee"),
        }
      );
    }
  };

  const onCreateClick = () => {
    form.reset(defaultFormValues);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const formatRate = (tf: any) => {
    if (tf.calculationType === "percentage") return `${Number(tf.rate)}%`;
    return `$${Number(tf.rate).toFixed(2)}`;
  };

  const formatCalculationType = (ct: string) => {
    switch (ct) {
      case "percentage": return "Percentage";
      case "fixed_per_unit": return "Fixed / Unit";
      case "fixed_flat": return "Fixed Flat";
      default: return ct;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Taxes & Fees</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={onCreateClick}>Create Tax/Fee</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Tax/Fee" : "Create Tax/Fee"}
              </DialogTitle>
              <DialogDescription>
                Configure taxes and fees that are automatically applied to bookings.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4 py-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. VAT, Tourism Levy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional description"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tax">Tax</SelectItem>
                            <SelectItem value="fee">Fee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="calculationBasis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calculation Basis</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select basis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="net">NET (subtotal only)</SelectItem>
                            <SelectItem value="gross">GROSS (subtotal + NET taxes)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="calculationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculation Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select calculation type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed_per_unit">Fixed per Unit ($/unit)</SelectItem>
                          <SelectItem value="fixed_flat">Fixed Flat ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchCalculationType === "percentage" ? "Rate (%)" : "Amount ($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step={watchCalculationType === "percentage" ? "0.01" : "0.01"}
                          placeholder={watchCalculationType === "percentage" ? "e.g. 17.5" : "e.g. 5.00"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchCalculationType === "fixed_per_unit" && (
                  <FormField
                    control={form.control}
                    name="maxUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Units (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g. 7 (cap at 7 days)"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Amount ($, optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="No minimum"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Amount ($, optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="No maximum"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {editingId ? "Update Tax/Fee" : "Create Tax/Fee"}
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
              <TableHead>Type</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>Rate/Amount</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead>Min/Max</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxFees.length ? (
              taxFees.map((tf: any) => (
                <TableRow key={tf.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tf.name}</div>
                      {tf.description && (
                        <div className="text-sm text-muted-foreground">
                          {tf.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tf.type === "tax" ? "default" : "outline"}>
                      {tf.type === "tax" ? "Tax" : "Fee"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCalculationType(tf.calculationType)}</TableCell>
                  <TableCell>{formatRate(tf)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tf.calculationBasis.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tf.maxUnits && <div>Max {tf.maxUnits} units</div>}
                      {tf.minAmount && <div>Min ${Number(tf.minAmount).toFixed(2)}</div>}
                      {tf.maxAmount && <div>Max ${Number(tf.maxAmount).toFixed(2)}</div>}
                      {!tf.maxUnits && !tf.minAmount && !tf.maxAmount && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tf.isActive ? "default" : "secondary"}>
                      {tf.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tf)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(tf.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8}>No taxes or fees found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
