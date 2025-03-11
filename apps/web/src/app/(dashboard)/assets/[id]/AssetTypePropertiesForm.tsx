'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/api/publicClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { SelectAsset } from '@repo/api-contract';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

type DynamicFormData = Record<string, string | number | string[]>;

export default function AssetTypePropertiesForm({ asset }: { asset: SelectAsset }) {
  const { mutate } = authClient.assets.addAssetProperties.useMutation();
  const { data: assetType } = authClient.settings.assetType.getAssetType.useQuery({
    queryKey: ['assetType', asset.assetTypeId],
    queryData: {
      params: { id: asset?.assetTypeId?.toString() as string },
    },
    enabled: !!asset?.assetTypeId,
  });

  // Dynamic schema based on asset type properties
  const generateSchema = () => {
    if (!assetType?.body.properties) return z.object({});

    const schemaFields: Record<string, z.ZodType<any>> = {};
    Object.entries(assetType.body.properties).forEach(([key, property]) => {
      switch (property.propertyType) {
        case 'number':
          schemaFields[key] = z.number().optional();
          break;
        case 'string':
          schemaFields[key] = z.string().optional();
          break;
        case 'textbox':
          schemaFields[key] = z.string().optional();
          break;
        case 'list':
          schemaFields[key] = z.array(z.string()).optional();
          break;
        default:
          schemaFields[key] = z.string().optional();
          break;
      }
    });
    return z.object(schemaFields);
  };
  const schema = generateSchema();

  const form = useForm<DynamicFormData>({
    resolver: zodResolver(schema),
  });

  // Reset form when asset type changes
  useEffect(() => {
    form.reset({});
  }, [asset.assetTypeId]);

  const processForm: SubmitHandler<DynamicFormData> = async (data: DynamicFormData) => {
 

    try {
      // Handle form submission
      console.log('Form data:', data);
      // Add your submission logic here
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (!assetType?.body.properties) {
    return <div>No properties defined for this asset type.</div>;
  }

  return (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle>Detailed Information</CardTitle>
        <CardDescription>
          Provide more details about your asset.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processForm)} className="space-y-4">
            {Object.entries(assetType.body.properties).map(([key, property]) => (
              <FormField
                key={key}
                control={form.control}
                name={key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{property.name || key}</FormLabel>
                    <FormControl>
                      <Input
                        type={property.propertyType === 'number' ? 'number' : 'text'}
                        placeholder={`Enter ${property.name}`}
                        {...field}
                        onChange={(e) => {
                          const value = property.propertyType === 'number'
                            ? parseFloat(e.target.value)
                            : e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    {/* {property.description && (
                  <FormDescription>{property.description}</FormDescription>
                )} */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit">Save Properties</Button>
          </form>
        </Form>
      </CardContent>
    </Card>

  );
}