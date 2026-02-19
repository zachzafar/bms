'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TagsInput } from '@/components/extension/tags-input';
import { authClient } from '@/lib/api/publicClient';
import { Settings2 } from 'lucide-react';

type PropertyValue = {
  propertyId: number;
  value: string;
};

type Props = {
  assetTypeId: number;
  assetTypeName: string;
};

export default function AssetTypeDefaultSpecsDialog({ assetTypeId, assetTypeName }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<PropertyValue[]>([]);

  // Fetch the asset type's assigned properties
  const { data: assetTypeData } = authClient.settings.assetType.getAssetType.useQuery({
    queryKey: ['assetType', assetTypeId],
    queryData: { params: { id: assetTypeId } },
    enabled: open && !!assetTypeId,
  });

  // Fetch existing default values
  const { data: existingData, refetch } = authClient.settings.assetType.getAssetTypePropertyValues.useQuery({
    queryKey: ['assetTypePropertyValues', assetTypeId],
    queryData: { params: { id: assetTypeId } },
    enabled: open && !!assetTypeId,
  });

  const { mutate: saveValues, isPending } = authClient.settings.assetType.setAssetTypePropertyValues.useMutation();

  const properties = assetTypeData?.status === 200 ? assetTypeData.body.properties : [];
  const existing = existingData?.status === 200 ? existingData.body : [];

  // Initialise form values when data loads
  useEffect(() => {
    if (!open) return;
    if (properties.length === 0) return;

    const existingMap = new Map(existing.map(e => [e.assetPropertyId, e.value]));
    setValues(
      properties.map(p => ({
        propertyId: p.id,
        value: existingMap.get(p.id) ?? '',
      }))
    );
  }, [open, properties.length, existing.length]);

  const handleChange = (propertyId: number, value: string | string[]) => {
    const stringValue = Array.isArray(value) ? value.join(',') : String(value);
    setValues(prev =>
      prev.map(v => (v.propertyId === propertyId ? { ...v, value: stringValue } : v))
    );
  };

  const handleSave = () => {
    saveValues(
      {
        params: { id: assetTypeId },
        body: { values: values.filter(v => v.value !== '') },
      },
      {
        onSuccess: () => {
          toast.success('Default specs saved');
          refetch();
          setOpen(false);
        },
        onError: () => toast.error('Failed to save default specs'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Set Default Specs">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Default Specs — {assetTypeName}</DialogTitle>
          <DialogDescription>
            Set default field values that apply to all assets of this type.
          </DialogDescription>
        </DialogHeader>

        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No fields are assigned to this asset type yet. Add fields in the asset type settings first.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            {properties.map(property => {
              const currentValue = values.find(v => v.propertyId === property.id)?.value ?? '';
              return (
                <div key={property.id} className="space-y-1">
                  <label className="text-sm font-medium">{property.name}</label>
                  {property.propertyType === 'textbox' ? (
                    <Textarea
                      value={currentValue}
                      onChange={e => handleChange(property.id, e.target.value)}
                      placeholder={`Enter ${property.name}`}
                      rows={2}
                    />
                  ) : property.propertyType === 'list' ? (
                    <TagsInput
                      value={currentValue ? currentValue.split(',') : []}
                      onValueChange={val => handleChange(property.id, val)}
                      placeholder={`Enter ${property.name}`}
                    />
                  ) : (
                    <Input
                      type={property.propertyType === 'number' ? 'number' : 'text'}
                      value={currentValue}
                      onChange={e => handleChange(property.id, e.target.value)}
                      placeholder={`Enter ${property.name}`}
                    />
                  )}
                </div>
              );
            })}
            <Button onClick={handleSave} disabled={isPending} className="w-full">
              {isPending ? 'Saving…' : 'Save Default Specs'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
