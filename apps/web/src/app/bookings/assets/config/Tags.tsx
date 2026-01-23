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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Plus, Trash2, Pencil, Upload, ImageIcon } from 'lucide-react';
import { authClient, axiosClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { InsertTagSchema, SelectTag } from '@repo/api-contract';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '@/components/extension/multi-select';
import { z } from 'zod';
import { useState, useRef } from 'react';
import Image from 'next/image';

const TagWithFormsSchema = InsertTagSchema.extend({
  forms: z.array(z.number()).optional(),
});

type TagWithForms = z.infer<typeof TagWithFormsSchema>;

export default function Tags() {
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [editingTag, setEditingTag] = useState<SelectTag | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { mutate: createTag, isPending: isCreating } = authClient.settings.tags.createTag.useMutation({
    onSuccess: () => {
      toast.success('Tag created successfully');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      form.reset();
      setSelectedForms([]);
    },
    onError: (error) => {
      toast.error(`Error creating tag: ${error}`);
    }
  });

  const { mutate: updateTag, isPending: isUpdating } = authClient.settings.tags.updateTag.useMutation({
    onSuccess: () => {
      toast.success('Tag updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsEditDialogOpen(false);
      setEditingTag(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Error updating tag: ${error}`);
    }
  });

  const { data: tags, isLoading } = authClient.settings.tags.getTags.useQuery({
    queryKey: ['tags']
  });

  const { data: bookingForms } = authClient.settings.form.getForms.useQuery({
    queryKey: ['bookingForms']
  });

  const { mutate: deleteTag } = authClient.settings.tags.deleteTag.useMutation({
    onSuccess: () => {
      toast.success('Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      toast.error(`Error deleting tag: ${error.message}`);
    }
  });

  const form = useForm<TagWithForms>({
    resolver: zodResolver(TagWithFormsSchema),
    defaultValues: {
      forms: []
    }
  });

  const editForm = useForm<TagWithForms>({
    resolver: zodResolver(TagWithFormsSchema),
    defaultValues: {
      forms: []
    }
  });

  const processForm: SubmitHandler<TagWithForms> = (data) => {
    const formIds = selectedForms.map(formName => {
      const formItem = bookingForms?.status === 200 &&
        bookingForms.body.data.find(f => f.name === formName);
      return formItem ? formItem.id : null;
    });

    const nonNullFormIds = formIds.filter(formId => formId !== null);

    const body = {
      ...data,
      forms: nonNullFormIds as number[]
    };

    createTag({ body });
  };

  const processEditForm: SubmitHandler<TagWithForms> = (data) => {
    if (!editingTag) return;

    updateTag({
      params: { id: editingTag.id },
      body: {
        name: data.name,
        description: data.description,
      }
    });
  };

  const handleEditClick = (tag: SelectTag) => {
    setEditingTag(tag);
    editForm.reset({
      name: tag.name,
      description: tag.description ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = async (tagId: number, file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await axiosClient.post(`/tags/${tagId}/image`, formData);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tagId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(tagId, file);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processForm)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
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
                      <Textarea {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forms"
                render={() => (
                  <FormItem>
                    <FormLabel>Booking Forms</FormLabel>
                    <MultiSelector
                      values={selectedForms}
                      onValuesChange={setSelectedForms}
                    >
                      <MultiSelectorTrigger>
                        <MultiSelectorInput placeholder="Select Booking Forms..." />
                      </MultiSelectorTrigger>
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {bookingForms?.status === 200 &&
                            bookingForms.body.data.map((formItem) => (
                              <MultiSelectorItem
                                key={formItem.id}
                                value={formItem.name}
                              >
                                {formItem.name}
                              </MultiSelectorItem>
                            ))}
                        </MultiSelectorList>
                      </MultiSelectorContent>
                    </MultiSelector>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isCreating}>
                <Plus className="mr-2 h-4 w-4" />
                {isCreating ? 'Creating...' : 'Add Tag'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags?.status === 200 && tags.body.data.length > 0 ? (
                tags.body.data.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      {tag.tagImage ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={tag.tagImage}
                            alt={tag.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>{tag.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e, tag.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleImageUpload(tag.id, file);
                            };
                            input.click();
                          }}
                          disabled={isUploading}
                          title="Upload Image"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(tag)}
                          title="Edit Tag"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTag({ params: { id: tag.id }, body: {} })}
                          title="Delete Tag"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No tags found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(processEditForm)} className="space-y-4">
              {editingTag?.tagImage && (
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <Image
                      src={editingTag.tagImage}
                      alt={editingTag.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file && editingTag) handleImageUpload(editingTag.id, file);
                    };
                    input.click();
                  }}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>

              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
