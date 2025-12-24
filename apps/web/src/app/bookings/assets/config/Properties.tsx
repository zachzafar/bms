'use client';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { InsertAssetProperty,InsertAssetPropertySchema } from '@/lib/api-contract';
import { StorageService } from '@/lib/api/storage';

export default function Properties() {
  const queryClient = authClient.useQueryClient()
  const tenant = StorageService.getTenant();

  const { data: properties, isLoading } = authClient.settings.properties.getProperties.useQuery({
    queryKey: ['properties']
  });

  const { mutate: createProperty } = authClient.settings.properties.createProperty.useMutation({
    onSuccess: () => {
      toast.success('Property created successfully');
      form.reset();

      queryClient.invalidateQueries({ queryKey: ['properties']});
    },
    onError: (error) => {
      toast.error(`Error creating property: ${error}`);
    }
  });

  const { mutate: deleteProperty } = authClient.settings.properties.deleteProperty.useMutation({
    onSuccess: () => {
      toast('Property deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Error deleting property: ${error.message}`);
    }
  });
  

  const form = useForm<InsertAssetProperty>({
    resolver: zodResolver(InsertAssetPropertySchema.omit({tenantId: true, createdAt: true, updatedAt: true, id: true})),
    defaultValues: {
      name: '',
      propertyType: 'string',
    },
  });



  const proccessform: SubmitHandler<InsertAssetProperty> = async (data: Omit<InsertAssetProperty,"tenantId">) => {
        console.log("proccessing form .... adding property")
    if (tenant)
      createProperty({
        body: { ...data, tenantId: tenant.id}
      },{
          onSuccess: () => {
            toast.success('Property created successfully');
            form.reset();
            // Invalidate the properties query to refresh the list

          }
      })

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
            <form onSubmit={form.handleSubmit(proccessform)} onChange={(e) => {
              console.log('e', e);
            }} className="space-y-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties?.status === 200 ? (
                properties.body.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.propertyType}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProperty({ params: { id: String(property.id) }, body: {} })}
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