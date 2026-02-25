'use client';

import { TagsInput } from '@/components/extension/tags-input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/api/publicClient';
import { SelectAsset } from '@repo/api-contract';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type PropertyValue = {
  propertyId: number;
  value: string | number | string[];
};

export default function AssetTypePropertiesForm({ asset }: { asset: SelectAsset }) {
  const { data: properties } = authClient.assets.getAssetProperties.useQuery({
    queryKey: ['ASSET_PROPERTIES', asset.id],
    queryData: { params: { id: asset.id } },
    enabled: !!asset?.id,
  });

  const [propertyValues, setPropertyValues] = useState<PropertyValue[]>([]);
  const { mutate } = authClient.assets.addAssetProperties.useMutation();

  const { data: assetType } = authClient.settings.assetType.getAssetType.useQuery({
    queryKey: ['assetType', asset.assetTypeId],
    queryData: { params: { id: asset?.assetTypeId } },
    enabled: !!asset?.assetTypeId,
  });

  // Fetch all properties (includes options for select/multi_select)
  const { data: allPropertiesData } = authClient.settings.properties.getProperties.useQuery({
    queryKey: ['properties'],
  });

  // Build a map of propertyId → options for quick lookup
  const optionsMap = useMemo(() => {
    if (allPropertiesData?.status !== 200) return {} as Record<number, { id: number; label: string }[]>;
    return allPropertiesData.body.data.reduce((acc, p) => {
      acc[p.id] = p.options ?? [];
      return acc;
    }, {} as Record<number, { id: number; label: string }[]>);
  }, [allPropertiesData]);

  const handleValueChange = (propertyId: number, value: string | number | string[]) => {
    setPropertyValues(prev => {
      const propertyExists = prev.some(item => item.propertyId === propertyId);
      if (propertyExists) {
        return prev.map(item =>
          item.propertyId === propertyId ? { ...item, value } : item
        );
      }
      return [...prev, { propertyId, value }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (propertyValues.length === 0) {
      toast.error('No property values to submit');
      return;
    }
    mutate(
      {
        params: { id: asset.id },
        body: {
          properties: propertyValues.map(({ propertyId, value }) => ({
            propertyId,
            value: Array.isArray(value) ? value.join(',') : value.toString(),
          })),
        },
      },
      {
        onSuccess: () => toast.success('Asset properties added successfully'),
        onError: (error) =>
          toast.error(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`),
      }
    );
  };

  // Initialize defaults when asset type loads (no existing values yet)
  useEffect(() => {
    if (assetType?.body.properties && !properties?.body) {
      const initialValues = Object.entries(assetType.body.properties).map(([, property]) => ({
        propertyId: property.id,
        value:
          property.propertyType === 'list' || property.propertyType === 'multi_select'
            ? []
            : property.propertyType === 'number'
            ? 0
            : '',
      }));
      setPropertyValues(initialValues);
    }
  }, [assetType?.body.properties, asset.assetTypeId, properties?.body]);

  // Load existing saved values
  useEffect(() => {
    if (properties?.body && assetType?.body.properties) {
      const propertyTypesMap = Object.entries(assetType.body.properties).reduce((acc, [, prop]) => {
        acc[prop.id] = prop.propertyType;
        return acc;
      }, {} as Record<number, string>);

      const existingValues = Object.entries(properties.body).map(([, property]) => {
        const propertyType = propertyTypesMap[property.assetPropertyId];
        return {
          propertyId: property.assetPropertyId,
          value:
            propertyType === 'list' || propertyType === 'multi_select'
              ? property.value.split(',').filter(Boolean)
              : propertyType === 'number'
              ? Number(property.value)
              : property.value,
        };
      });
      setPropertyValues(existingValues);
    }
  }, [properties?.body, assetType?.body.properties]);

  if (!assetType?.body.properties) {
    return <div>No properties defined for this asset type.</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Detailed Information</CardTitle>
        <CardDescription>Provide more details about your asset.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(assetType.body.properties).map(([key, property]) => {
            const currentValue = propertyValues.find(p => p.propertyId === property.id)?.value;
            const options = optionsMap[property.id] ?? [];

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
                      value={(currentValue as string[]) || []}
                      onValueChange={(value) => handleValueChange(property.id, value)}
                      placeholder={`Enter ${property.name}`}
                    />
                  ) : property.propertyType === 'select' ? (
                    <Select
                      value={currentValue as string}
                      onValueChange={(v) => handleValueChange(property.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${property.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (
                          <SelectItem key={o.id} value={o.label}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : property.propertyType === 'multi_select' ? (
                    <div className="flex flex-col gap-2">
                      {options.map((o) => {
                        const selected = ((currentValue as string[]) || []).includes(o.label);
                        return (
                          <div key={o.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`${property.id}-${o.id}`}
                              checked={selected}
                              onCheckedChange={(checked) => {
                                const prev = (currentValue as string[]) || [];
                                handleValueChange(
                                  property.id,
                                  checked ? [...prev, o.label] : prev.filter((v) => v !== o.label)
                                );
                              }}
                            />
                            <Label htmlFor={`${property.id}-${o.id}`}>{o.label}</Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Input
                      type={property.propertyType === 'number' ? 'number' : 'text'}
                      placeholder={`Enter ${property.name}`}
                      value={currentValue as string | number}
                      onChange={(e) => {
                        const value =
                          property.propertyType === 'number'
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
