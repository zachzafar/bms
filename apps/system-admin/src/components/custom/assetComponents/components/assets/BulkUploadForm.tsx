'use client';

import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, Form, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authClient, axiosClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRef, useState } from 'react';

const BulkUploadSchema = z.object({
  assetTypeId: z.number().min(1, 'Asset type is required'),
  file: z.instanceof(File, { message: 'Please select a file' })
});

type BulkUploadFormData = z.infer<typeof BulkUploadSchema>;

interface BulkUploadFormProps {
  tenantId: string;
  onSuccess?: () => void;
}

function BulkUploadForm({ tenantId, onSuccess }: BulkUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [isUploading, setIsUploading] = useState(false);
  // Remove unused StorageService import
  // Remove ts-rest mutation for bulkUpload; we'll use axiosClient with FormData
  // const { mutate: bulkUpload, isPending } = authClient.systemAdmin.bulkUpload.useMutation();
  const { data: assetTypes } = authClient.systemAdmin.getAssetTypes.useQuery({
    queryKey: ['assetTypes'],
    queryData: {
      params: { tenantId }
    }
  });

  const form = useForm<BulkUploadFormData>({
    resolver: zodResolver(BulkUploadSchema)
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('file', file);
      form.clearErrors('file');
    }
  };

  const processForm: SubmitHandler<BulkUploadFormData> = async (data) => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    // Create multipart/form-data payload like Images.tsx
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('assetTypeId', String(data.assetTypeId));
    formData.append('tenantId', tenantId);

    try {
      setIsUploading(true);
      await axiosClient.post('/system-admin/bulk-upload', formData);
      toast.success('Assets uploaded successfully');
      form.reset();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading assets:', error);
      toast.error('Failed to upload assets');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processForm)} className="space-y-4">
        <FormField
          control={form.control}
          name="assetTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="asset-type">Asset Type</FormLabel>
              <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger id="asset-type">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetTypes?.status === 200 ? assetTypes.body.map((type) => (
                    <SelectItem key={type.id} value={type.id?.toString()}>
                      {type.name}
                    </SelectItem>
                  )) : <SelectItem value="no-types">No Asset Types Found</SelectItem>}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the asset type for bulk upload
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="file-upload">Upload File</FormLabel>
              <FormControl>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </FormControl>
              <FormDescription>
                Upload a JSON or CSV file containing asset data
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
        
        <Button type="submit" disabled={isUploading || !selectedFile}>
          {isUploading ? 'Uploading...' : 'Upload Assets'}
        </Button>
      </form>
    </Form>
  );
}

export default BulkUploadForm;