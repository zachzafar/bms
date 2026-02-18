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
import { ADDONS_QUERY_KEY } from "@/lib/api/queryKeys";
import { Badge } from "@/components/ui/badge";

const addonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  billingType: z.enum(["per_unit", "flat"]),
  isActive: z.boolean(),
});

type AddonFormValues = z.infer<typeof addonSchema>;

const defaultFormValues: AddonFormValues = {
  name: "",
  description: "",
  price: 0,
  billingType: "flat",
  isActive: true,
};

export default function AddonsPage() {
  const { data: addonData, refetch } = authClient.addons.getAddons.useQuery({
    queryKey: ADDONS_QUERY_KEY,
    queryData: { query: { page: 1, pageSize: 100 } },
  });
  const { mutate: createAddon } = authClient.addons.createAddon.useMutation();
  const { mutate: updateAddon } = authClient.addons.updateAddon.useMutation();
  const { mutate: deleteAddon } = authClient.addons.deleteAddon.useMutation();

  const addons = addonData?.body?.data ?? [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<number | null>(null);

  const form = useForm<AddonFormValues>({
    defaultValues: defaultFormValues,
  });

  const handleSubmit = (values: AddonFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      price: values.price.toString(),
      billingType: values.billingType,
      isActive: values.isActive,
    };

    const resetState = () => {
      setEditingAddonId(null);
      form.reset(defaultFormValues);
      setIsDialogOpen(false);
    };

    if (editingAddonId) {
      updateAddon(
        { params: { id: editingAddonId }, body: payload },
        {
          onSuccess: () => {
            toast.success("Add-on updated");
            refetch();
            resetState();
          },
          onError: () => toast.error("Failed to update add-on"),
        }
      );
    } else {
      createAddon(
        { body: payload },
        {
          onSuccess: () => {
            toast.success("Add-on created");
            refetch();
            resetState();
          },
          onError: () => toast.error("Failed to create add-on"),
        }
      );
    }
  };

  const handleEdit = (addon: any) => {
    form.reset({
      name: addon.name,
      description: addon.description ?? "",
      price: addon.price ? Number(addon.price) : 0,
      billingType: addon.billingType,
      isActive: addon.isActive,
    });
    setEditingAddonId(addon.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this add-on?")) {
      deleteAddon(
        { params: { id }, body: undefined },
        {
          onSuccess: () => {
            toast.success("Add-on deleted");
            refetch();
          },
          onError: () => toast.error("Failed to delete add-on"),
        }
      );
    }
  };

  const onCreateClick = () => {
    form.reset(defaultFormValues);
    setEditingAddonId(null);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Add-Ons</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={onCreateClick}>Create Add-On</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddonId ? "Edit Add-On" : "Create Add-On"}
              </DialogTitle>
              <DialogDescription>
                Add-ons are extra items that can be attached to bookings.
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
                        <Input {...field} placeholder="e.g. Car Seat" />
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

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="per_unit">
                            Per Unit (price x quantity x booking units)
                          </SelectItem>
                          <SelectItem value="flat">
                            Flat (price x quantity for whole booking)
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                  {editingAddonId ? "Update Add-On" : "Create Add-On"}
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
              <TableHead>Price</TableHead>
              <TableHead>Billing Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.length ? (
              addons.map((addon: any) => (
                <TableRow key={addon.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{addon.name}</div>
                      {addon.description && (
                        <div className="text-sm text-muted-foreground">
                          {addon.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${Number(addon.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {addon.billingType === "per_unit" ? "Per Unit" : "Flat"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={addon.isActive ? "default" : "secondary"}>
                      {addon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(addon)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(addon.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>No add-ons found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
