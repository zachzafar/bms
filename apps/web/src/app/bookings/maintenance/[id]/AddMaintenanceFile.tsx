import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table'
import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { authClient, axiosClient } from '@/lib/api/publicClient';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function AddMaintenanceFile() {
    const params = useParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const { data, refetch } = authClient.maintenance.getMaintenanceFiles.useQuery({
        queryKey: ["maintenance-files", params.id as string],
        queryData:  {
          params: {
            id: params.id as string,
          },
        },
      });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setSelectedFiles(prev => [...prev, ...files]);
        // Reset the input value so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const handleRemoveSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }

    const handleUploadFiles = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });

        try {
            await axiosClient.post(`maintenance/${params.id}/files`, formData);
            setSelectedFiles([]);
            refetch();
            toast.success('Files uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload files');
        }
    }

    const handleDeleteFile = async (fileId: number) => {
        try {
            await axiosClient.delete(`maintenance/${params.id}/files/${fileId}`);
            refetch();
            toast.success('File deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete file');
        }
    }

    const files = data?.status === 200 ? data.body.data : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Files</CardTitle>
        <div className="flex gap-2">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          <Button onClick={() => fileInputRef.current?.click()}>Select Files</Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Selected Files</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveSelectedFile(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={handleUploadFiles}>Upload Files</Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.id}</TableCell>
                <TableCell>{file.uploadedAt.toString()}</TableCell>
                <TableCell>
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

