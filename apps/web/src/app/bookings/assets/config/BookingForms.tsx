'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { XIcon, Plus, EyeIcon, PencilIcon, TrashIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { InsertBookingFormFieldSchema } from '@repo/api-contract';
import * as z from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { StorageService } from '@/lib/api/storage';
import { Checkbox } from '@/components/ui/checkbox';

const bookingFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(InsertBookingFormFieldSchema.omit({ formId: true })),
});

// Separate component for options field to avoid React Hooks violation
const OptionsField = ({ field }: { field: any }) => {
  const currentOptions = field.value ? JSON.parse(field.value) : [];
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim()) {
      const updated = [...currentOptions, newOption.trim()];
      field.onChange(JSON.stringify(updated));
      setNewOption('');
    }
  };

  const removeOption = (indexToRemove: number) => {
    const updated = currentOptions.filter((_: string, i: number) => i !== indexToRemove);
    field.onChange(JSON.stringify(updated));
  };

  return (
    <FormItem className="col-span-2">
      <FormLabel>Options</FormLabel>
      <FormControl>
        <div className="space-y-2">
          {/* Display existing options */}
          {currentOptions.length > 0 && (
            <div className="border rounded p-2 space-y-1 max-h-32 overflow-y-auto">
              {currentOptions.map((option: string, optIdx: number) => (
                <div key={optIdx} className="flex items-center justify-between bg-secondary px-2 py-1 rounded text-sm">
                  <span>{option}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeOption(optIdx)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {/* Add new option */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter an option"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOption();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </FormControl>
      <FormDescription>Add options for this select field</FormDescription>
      <FormMessage />
    </FormItem>
  );
};

const ModifiedInsertBookingFormFieldSchema = InsertBookingFormFieldSchema.omit({
  formId: true,
});

type Field = z.infer<typeof ModifiedInsertBookingFormFieldSchema>;
type BookingFormValues = z.infer<typeof bookingFormSchema>;
type FieldType = Field['type'];

function BookingForms() {
  const tenant = StorageService.getTenant();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<number | null>(null);
  const [viewingFormId, setViewingFormId] = useState<number | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<number | null>(null);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');

  const { data: bookingForms, isLoading, refetch } = authClient.settings.form.getForms.useQuery({
    queryKey: ['bookingForms'],
  });

  const [viewingFormData, setViewingFormData] = useState<any>(null);

  const { mutate: createBookingForm, isPending: isCreating } = authClient.settings.form.createForm.useMutation({
    onSuccess: () => {
      toast.success('Booking form created successfully');
      form.reset();
      setIsDialogOpen(false);
      setNewFieldOptions([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error creating booking form: ${error}`);
    },
  });

  const { mutate: updateBookingForm, isPending: isUpdating } = authClient.settings.form.updateForm.useMutation({
    onSuccess: () => {
      toast.success('Booking form updated successfully');
      form.reset();
      setIsDialogOpen(false);
      setEditingFormId(null);
      setNewFieldOptions([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error updating booking form: ${error}`);
    },
  });

  const { mutate: deleteBookingForm } = authClient.settings.form.deleteForm.useMutation({
    onSuccess: () => {
      toast.success('Booking form deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingFormId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting booking form: ${error}`);
    },
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: '',
      description: '',
      fields: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const onSubmit = (data: BookingFormValues) => {
    const { fields, ...formData } = data;

    // Add displayOrder to fields
    const fieldsWithOrder = fields.map((field, index) => ({
      ...field,
      displayOrder: index,
    }));

    if (tenant) {
      if (editingFormId) {
        updateBookingForm({
          params: { id: editingFormId },
          body: {
            form: { ...formData },
            fields: fieldsWithOrder
          },
        });
      } else {
        createBookingForm({
          body: {
            fields: fieldsWithOrder,
            form: { ...formData, tenantId: tenant.id }
          },
        });
      }
    }
  };

  const handleEdit = async (formId: number) => {
    const formToEdit = bookingForms?.body.data.find((f) => f.id === formId);
    if (!formToEdit) return;

    // Fetch full form data with fields
    const response = await authClient.settings.form.getForm.query({
      params: { id: formId }
    });

    if (response.status === 200) {
      const { form: formData, fields: formFields } = response.body;

      // Sort fields by displayOrder
      const sortedFields = [...formFields].sort((a, b) =>
        (a.displayOrder || 0) - (b.displayOrder || 0)
      );

      form.reset({
        name: formData.name,
        description: formData.description || '',
        fields: sortedFields.map(field => ({
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || undefined,
          helpText: field.helpText || undefined,
          minValue: field.minValue || undefined,
          maxValue: field.maxValue || undefined,
          options: field.options || undefined,
          allowMultiple: field.allowMultiple || false,
          displayOrder: field.displayOrder || 0,
        })),
      });

      setEditingFormId(formId);
      setIsDialogOpen(true);
    }
  };

  const handleView = async (formId: number) => {
    setViewingFormId(formId);
    setIsViewDialogOpen(true);

    // Fetch form data
    const response = await authClient.settings.form.getForm.query({
      params: { id: formId }
    });

    if (response.status === 200) {
      setViewingFormData(response.body);
    }
  };

  const handleDelete = (formId: number) => {
    setDeletingFormId(formId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingFormId) {
      deleteBookingForm({
        params: { id: deletingFormId },
      });
    }
  };

  const handleCreateNew = () => {
    form.reset({
      name: '',
      description: '',
      fields: [],
    });
    setEditingFormId(null);
    setNewFieldOptions([]);
    setIsDialogOpen(true);
  };

  const addOptionToNewField = () => {
    if (newOptionInput.trim()) {
      setNewFieldOptions([...newFieldOptions, newOptionInput.trim()]);
      setNewOptionInput('');
    }
  };

  const removeOptionFromNewField = (index: number) => {
    setNewFieldOptions(newFieldOptions.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      move(index, index - 1);
    } else if (direction === 'down' && index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Booking Forms</CardTitle>
          <CardDescription>Design custom forms for booking requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFormId ? 'Edit' : 'Create'} Booking Form</DialogTitle>
            <DialogDescription>
              {editingFormId ? 'Update' : 'Design'} a custom form for booking requests.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter form name" {...field} />
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
                        placeholder="Enter form description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <label className="text-sm font-medium leading-none">Form Fields</label>
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveField(index, 'down')}
                            disabled={index === fields.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`fields.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Field Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Field name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`fields.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="textarea">Textarea</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="time">Time</SelectItem>
                                    <SelectItem value="date_range">Date Range</SelectItem>
                                    <SelectItem value="range">Range (Slider)</SelectItem>
                                    <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                                    <SelectItem value="select">Select (Options)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`fields.${index}.placeholder`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Placeholder</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional placeholder text" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`fields.${index}.helpText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Help Text</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional help text" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {(form.watch(`fields.${index}.type`) === 'number' || form.watch(`fields.${index}.type`) === 'range') && (
                            <>
                              <FormField
                                control={form.control}
                                name={`fields.${index}.minValue`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Min Value</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Minimum value" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`fields.${index}.maxValue`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Max Value</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Maximum value" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          {form.watch(`fields.${index}.type`) === 'select' && (
                            <>
                              <FormField
                                control={form.control}
                                name={`fields.${index}.options`}
                                render={({ field }) => <OptionsField field={field} />}
                              />
                              <FormField
                                control={form.control}
                                name={`fields.${index}.allowMultiple`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value || false}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="!mt-0">Allow Multiple Selections</FormLabel>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          <FormField
                            control={form.control}
                            name={`fields.${index}.required`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Required</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    append({
                      name: '',
                      type: 'text',
                      required: false,
                      placeholder: undefined,
                      helpText: undefined,
                      minValue: undefined,
                      maxValue: undefined,
                      options: undefined,
                      allowMultiple: false,
                      displayOrder: fields.length,
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : editingFormId ? 'Update Form' : 'Create Form'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>Preview of the booking form</DialogDescription>
          </DialogHeader>
          {viewingFormData ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{viewingFormData.form.name}</h3>
                {viewingFormData.form.description && (
                  <p className="text-sm text-muted-foreground">{viewingFormData.form.description}</p>
                )}
              </div>
              <div className="space-y-3">
                {[...viewingFormData.fields]
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map((field) => (
                    <div key={field.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          {field.name}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <span className="text-xs text-muted-foreground">{field.type}</span>
                      </div>
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                      )}
                      {field.placeholder && (
                        <p className="text-xs text-muted-foreground italic">Placeholder: {field.placeholder}</p>
                      )}
                      {field.options && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Options:</p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {JSON.parse(field.options).map((option: string, idx: number) => (
                              <li key={idx}>{option}</li>
                            ))}
                          </ul>
                          {field.allowMultiple && (
                            <p className="text-xs text-muted-foreground italic">Multiple selections allowed</p>
                          )}
                        </div>
                      )}
                      {(field.minValue || field.maxValue) && (
                        <p className="text-xs text-muted-foreground">
                          Range: {field.minValue || 'none'} - {field.maxValue || 'none'}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">Loading form data...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Existing Forms Table */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Existing Booking Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingForms?.status === 200 && bookingForms.body.data.length > 0 ? (
                bookingForms.body.data.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{form.description || '-'}</TableCell>
                    <TableCell>
                      {/* Show field count - need to fetch to get count */}
                      <span className="text-sm text-muted-foreground">View for details</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(form.id)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(form.id)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(form.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No booking forms found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default BookingForms;
