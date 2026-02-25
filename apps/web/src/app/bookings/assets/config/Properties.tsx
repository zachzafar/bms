'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { InsertAssetProperty, InsertAssetPropertySchema } from '@repo/api-contract';
import { StorageService } from '@/lib/api/storage';
import { TagsInput } from '@/components/extension/tags-input';
import { Label } from '@/components/ui/label';

const TYPE_LABELS: Record<string, string> = {
  string: 'Text',
  number: 'Number',
  textbox: 'Text Box',
  list: 'List',
  select: 'Single Select',
  multi_select: 'Multi Select',
};

export default function Properties() {
  const queryClient = authClient.useQueryClient();
  const tenant = StorageService.getTenant();
  const [pendingOptions, setPendingOptions] = useState<string[]>([]);

  const { data: properties, isLoading } = authClient.settings.properties.getProperties.useQuery({
    queryKey: ['properties'],
  });

  const { mutate: setPropertyOptions } = authClient.settings.properties.setPropertyOptions.useMutation();

  const { mutate: createProperty } = authClient.settings.properties.createProperty.useMutation({
    onError: (error) => {
      toast.error(`Error creating property: ${error}`);
    },
  });

  const { mutate: deleteProperty } = authClient.settings.properties.deleteProperty.useMutation({
    onSuccess: () => {
      toast('Property deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error: any) => {
      toast.error(`Error deleting property: ${error.message}`);
    },
  });

  const form = useForm<InsertAssetProperty>({
    resolver: zodResolver(InsertAssetPropertySchema.omit({ tenantId: true, createdAt: true, updatedAt: true, id: true })),
    defaultValues: {
      name: '',
      propertyType: 'string',
    },
  });

  const selectedType = form.watch('propertyType');
  const needsOptions = selectedType === 'select' || selectedType === 'multi_select';

  const proccessform: SubmitHandler<InsertAssetProperty> = async (data: Omit<InsertAssetProperty, 'tenantId'>) => {
    if (!tenant) return;
    createProperty(
      { body: { ...data, tenantId: tenant.id } },
      {
        onSuccess: (res) => {
          const newId = res.body.id;
          const saveOptions = () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            toast.success('Property created successfully');
            form.reset();
            setPendingOptions([]);
          };
          if (needsOptions && pendingOptions.length > 0) {
            setPropertyOptions(
              { params: { id: newId }, body: { options: pendingOptions } },
              { onSuccess: saveOptions, onError: saveOptions }
            );
          } else {
            saveOptions();
          }
        },
      }
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Field</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(proccessform)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter field name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v); setPendingOptions([]); }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="textbox">Text Box</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="select">Single Select</SelectItem>
                        <SelectItem value="multi_select">Multi Select</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsOptions && (
                <div className="space-y-1">
                  <Label>Options</Label>
                  <TagsInput
                    value={pendingOptions}
                    onValueChange={setPendingOptions}
                    placeholder="Type an option and press Enter"
                  />
                  <p className="text-xs text-muted-foreground">
                    Press Enter to add each option.
                  </p>
                </div>
              )}

              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties?.status === 200 ? (
                properties.body.data.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{TYPE_LABELS[property.propertyType] ?? property.propertyType}</TableCell>
                    <TableCell>
                      {(property.propertyType === 'select' || property.propertyType === 'multi_select') && property.options?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {property.options.map(o => (
                            <Badge key={o.id} variant="secondary">{o.label}</Badge>
                          ))}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProperty({ params: { id: property.id }, body: {} })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No properties found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}