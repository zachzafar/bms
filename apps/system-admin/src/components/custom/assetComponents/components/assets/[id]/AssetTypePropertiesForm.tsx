'use client';

import { TagsInput } from '@/components/extension/tags-input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/api/publicClient';
import { SelectAsset } from '@repo/api-contract';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type PropertyValue = {
  propertyId: number;
  value: string | number | string[];
};

export default function AssetTypePropertiesForm({ asset }: { asset: SelectAsset }) {
  const { data: properties } = authClient.assets.getAssetProperties.useQuery({
    queryKey: ['ASSET_PROPERTIES', asset.id],
    queryData: {
      params: { id: asset.id },
    },
    enabled:!!asset?.id,
  });

  const [propertyValues, setPropertyValues] = useState<PropertyValue[]>([]);
  const { mutate } = authClient.assets.addAssetProperties.useMutation();
  
  const { data: assetType } = authClient.settings.assetType.getAssetType.useQuery({
    queryKey: ['assetType', asset.assetTypeId],
    queryData: {
      params: { id: asset?.assetTypeId?.toString() as string },
    },
    enabled: !!asset?.assetTypeId,
  });



  const handleValueChange = (propertyId: number, value: string | number | string[]) => {
    setPropertyValues(prev => {
      // Check if the property already exists in the array
      const propertyExists = prev.some(item => item.propertyId === propertyId);
      
      if (propertyExists) {
        // Update existing property
        return prev.map(item => 
          item.propertyId === propertyId ? { ...item, value } : item
        );
      } else {
        // Add new property
        return [...prev, { propertyId, value }];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting property values:', propertyValues);
    
    // Only submit if there are property values
    if (propertyValues.length === 0) {
      toast.error("No property values to submit");
      return;
    }
    
    mutate({
      params:{
        id: asset.id,
      },
      body:{
      properties: propertyValues.map(({ propertyId, value }) => ({
        propertyId,
        value: Array.isArray(value)? value.join(',') : value.toString(),
      }))}
    },
    {
      onSuccess:()=>{
        toast.success("Asset properties added successfully")
      },
      onError:(error)=>{
        toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);

      }
    }
  )
   
  };

  // Initialize or reset property values when asset type changes
  useEffect(() => {
    if (assetType?.body.properties && !properties?.body) {
      // Only initialize default values if we don't have existing properties
      const initialValues = Object.entries(assetType.body.properties).map(([key, property]) => ({
        propertyId: property.id,
        value: property.propertyType === 'list' ? [] : 
               property.propertyType === 'number' ? 0 : '',
      }));
      setPropertyValues(initialValues);
    }
  }, [assetType?.body.properties, asset.assetTypeId, properties?.body]);

  // Load existing property values when available
  useEffect(() => {
    if (properties?.body && assetType?.body.properties) {
      // Create a map of property types for reference
      const propertyTypesMap = Object.entries(assetType.body.properties).reduce((acc, [key, prop]) => {
        acc[prop.id] = prop.propertyType;
        return acc;
      }, {} as Record<number, string>);
      console.log("property types map", propertyTypesMap)
      // Map existing values with proper type conversion
      const existingValues = Object.entries(properties.body).map(([key, property]) => {
        const propertyType = propertyTypesMap[property.assetPropertyId];
        return {
          propertyId: property.assetPropertyId,
          value: propertyType === 'list' ? property.value.split(',') : 
                 propertyType === 'number' ? Number(property.value) : 
                 property.value,
        };
      });
      console.log("existing values", existingValues)
      
      setPropertyValues(existingValues);
    }
  }, [properties?.body, assetType?.body.properties]);

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
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(assetType.body.properties).map(([key, property]) => {
            const currentValue = propertyValues.find(p => p.propertyId === property.id)?.value;
            
            return (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {property.name}
                </label>
                <div>
                  {property.propertyType === 'textbox' ? (
                    <Textarea
                      placeholder={`Enter ${property.name}`}
                      value={currentValue as string}
                      onChange={(e) => handleValueChange(property.id, e.target.value)}
                    />
                  ) : property.propertyType === 'list' ? (
                    <TagsInput
                      value={currentValue as string[] || []}
                      onValueChange={(value) => handleValueChange(property.id, value)}
                      placeholder={`Enter ${property.name}`}
                    />
                  ) : (
                    <Input
                      type={property.propertyType === 'number' ? 'number' : 'text'}
                      placeholder={`Enter ${property.name}`}
                      value={currentValue as string | number}
                      onChange={(e) => {
                        const value = property.propertyType === 'number'
                          ? parseFloat(e.target.value) || 0
                          : e.target.value;
                        handleValueChange(property.id, value);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <Button type="submit">Save Properties</Button>
        </form>
      </CardContent>
    </Card>
  );
}