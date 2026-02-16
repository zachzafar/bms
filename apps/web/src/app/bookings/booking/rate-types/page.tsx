"use client";

import { useState } from "react";
import { authClient } from "@/lib/api/publicClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RATE_TYPES_QUERY_KEY } from "@/lib/api/queryKeys";

const rateTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  minutes: z.coerce.number().min(1, "Minutes must be at least 1"),
});

type RateTypeFormValues = z.infer<typeof rateTypeSchema>;

const defaultFormValues: RateTypeFormValues = {
  name: "",
  minutes: 60,
};

export default function RateTypesPage() {
  const { data: rateTypesData, refetch } = authClient.rates.getRateTypes.useQuery({
    queryKey: RATE_TYPES_QUERY_KEY,
  });
  const { mutate: createRateType } = authClient.rates.createRateType.useMutation();
  const { mutate: updateRateType } = authClient.rates.updateRateType.useMutation();
  const { mutate: deleteRateType } = authClient.rates.deleteRateType.useMutation();

  const rateTypes = rateTypesData?.body.data ?? [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<RateTypeFormValues>({
    resolver: zodResolver(rateTypeSchema),
    defaultValues: defaultFormValues,
  });

  const resetState = () => {
    setEditingId(null);
    form.reset(defaultFormValues);
    setIsDialogOpen(false);
  };

  const handleSubmit = (values: RateTypeFormValues) => {
    if (editingId) {
      updateRateType(
        { params: { id: editingId }, body: values },
        {
          onSuccess: () => {
            toast.success("Rate type updated");
            refetch();
            resetState();
          },
          onError: () => toast.error("Failed to update rate type"),
        }
      );
    } else {
      createRateType(
        { body: values },
        {
          onSuccess: () => {
            toast.success("Rate type created");
            refetch();
            resetState();
          },
          onError: () => toast.error("Failed to create rate type"),
        }
      );
    }
  };

  const handleEdit = (rateType: any) => {
    form.reset({
      name: rateType.name,
      minutes: rateType.minutes,
    });
    setEditingId(rateType.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this rate type?")) {
      deleteRateType(
        { params: { id }, body: undefined },
        {
          onSuccess: () => {
            toast.success("Rate type deleted");
            refetch();
          },
          onError: () => toast.error("Failed to delete rate type"),
        }
      );
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes / 1440 > 1 ? "s" : ""}`;
    if (minutes % 60 === 0) return `${minutes / 60} hr${minutes / 60 > 1 ? "s" : ""}`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rate Types</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                form.reset(defaultFormValues);
                setEditingId(null);
                setIsDialogOpen(true);
              }}
            >
              Create Rate Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Rate Type" : "Create Rate Type"}
              </DialogTitle>
              <DialogDescription>
                Define a billing interval for your rates (e.g. Hourly = 60 min, Daily = 1440 min)
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
                        <Input {...field} placeholder="e.g. Hourly, Daily, Half Hour" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minutes"
                  render={({ field }) => {
                    const totalMinutes = field.value || 0;
                    const days = Math.floor(totalMinutes / 1440);
                    const hours = Math.floor((totalMinutes % 1440) / 60);
                    const mins = totalMinutes % 60;

                    const updateTotal = (d: number, h: number, m: number) => {
                      field.onChange(d * 1440 + h * 60 + m);
                    };

                    return (
                      <FormItem>
                        <FormLabel>Duration per unit</FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">Days</label>
                            <Input
                              type="number"
                              min={0}
                              value={days}
                              onChange={(e) => updateTotal(Number(e.target.value) || 0, hours, mins)}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">Hours</label>
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              value={hours}
                              onChange={(e) => updateTotal(days, Number(e.target.value) || 0, mins)}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">Minutes</label>
                            <Input
                              type="number"
                              min={0}
                              max={59}
                              value={mins}
                              onChange={(e) => updateTotal(days, hours, Number(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            { label: "30 min", value: 30 },
                            { label: "1 hour", value: 60 },
                            { label: "2 hours", value: 120 },
                            { label: "4 hours", value: 240 },
                            { label: "Half day", value: 720 },
                            { label: "1 day", value: 1440 },
                            { label: "1 week", value: 10080 },
                          ].map((preset) => (
                            <Button
                              key={preset.value}
                              type="button"
                              variant={totalMinutes === preset.value ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => field.onChange(preset.value)}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total: {totalMinutes} minutes ({formatMinutes(totalMinutes)})
                        </p>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <Button type="submit" className="w-full">
                  {editingId ? "Update Rate Type" : "Create Rate Type"}
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
              <TableHead>Minutes</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateTypes.length > 0 ? (
              rateTypes.map((rt: any) => (
                <TableRow key={rt.id}>
                  <TableCell className="font-medium">{rt.name}</TableCell>
                  <TableCell>{rt.minutes}</TableCell>
                  <TableCell>{formatMinutes(rt.minutes)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rt)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(rt.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>No rate types found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
