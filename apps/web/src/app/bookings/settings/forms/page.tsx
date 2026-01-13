'use client';

import { useState } from 'react';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Link2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

type FormField = {
  id?: number;
  name: string;
  type: 'number' | 'text' | 'textarea' | 'date' | 'time' | 'date_range' | 'range' | 'boolean';
  required: boolean;
};

type FormData = {
  name: string;
  description?: string;
  fields: FormField[];
};

export default function FormsManagementPage() {
  const currentTenant = StorageService.getTenant();
  const tenantId = currentTenant?.id;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [assignmentType, setAssignmentType] = useState<'asset' | 'assetType' | 'tag'>('asset');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    fields: [],
  });

  const [newField, setNewField] = useState<FormField>({
    name: '',
    type: 'text',
    required: false,
  });

  // Fetch forms
  const { data: formsResponse, isLoading, refetch } = authClient.settings.form.getForms.useQuery({
    queryKey: ['forms', tenantId],
    queryData: {
      query: { page: 1, pageSize: 100 },
    },
  });

  const forms = formsResponse?.status === 200 ? formsResponse.body.data : [];

  // Fetch assets for assignment
  const { data: assetsResponse } = authClient.assets.getAssets.useQuery({
    queryKey: ['assets', tenantId],
    queryData: {
      query: { page: 1, pageSize: 100 },
    },
  });

  const assets = assetsResponse?.status === 200 ? assetsResponse.body.data : [];

  // Fetch asset types
  const { data: assetTypesResponse } = authClient.settings.assetType.getAssetTypes.useQuery({
    queryKey: ['asset-types', tenantId],
    queryData: {
      query: { page: 1, pageSize: 100 },
    },
  });

  const assetTypes = assetTypesResponse?.status === 200 ? assetTypesResponse.body.data : [];

  // Fetch tags
  const { data: tagsResponse } = authClient.settings.tags.getTags.useQuery({
    queryKey: ['tags', tenantId],
    queryData: {
      query: { page: 1, pageSize: 100 },
    },
  });

  const tags = tagsResponse?.status === 200 ? tagsResponse.body.data : [];

  // Create form mutation
  const { mutate: createForm, isPending: isCreating } = authClient.settings.form.createForm.useMutation({
    onSuccess: () => {
      toast.success('Form created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error('Failed to create form');
      console.error(error);
    },
  });

  // Delete form mutation
  const { mutate: deleteForm } = authClient.settings.form.deleteForm.useMutation({
    onSuccess: () => {
      toast.success('Form deleted successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete form');
    },
  });

  // Assignment mutations
  const { mutate: assignToAsset } = authClient.settings.form.assignFormToAsset.useMutation({
    onSuccess: () => {
      toast.success('Form assigned to asset successfully');
      setIsAssignDialogOpen(false);
      setSelectedTargetId('');
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to assign form');
    },
  });

  const { mutate: assignToAssetType } = authClient.settings.form.assignFormToAssetType.useMutation({
    onSuccess: () => {
      toast.success('Form assigned to asset type successfully');
      setIsAssignDialogOpen(false);
      setSelectedTargetId('');
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to assign form');
    },
  });

  const { mutate: assignToTag } = authClient.settings.form.assignFormToTag.useMutation({
    onSuccess: () => {
      toast.success('Form assigned to tag successfully');
      setIsAssignDialogOpen(false);
      setSelectedTargetId('');
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to assign form');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', fields: [] });
    setNewField({ name: '', type: 'text', required: false });
  };

  const handleAddField = () => {
    if (!newField.name.trim()) {
      toast.error('Field name is required');
      return;
    }

    setFormData({
      ...formData,
      fields: [...formData.fields, { ...newField }],
    });
    setNewField({ name: '', type: 'text', required: false });
  };

  const handleRemoveField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    });
  };

  const handleCreateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Form name is required');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    createForm({
      body: {
        form: {
          name: formData.name,
          description: formData.description || undefined,
          tenantId: tenantId!,
        },
        fields: formData.fields.map(f => ({
          name: f.name,
          type: f.type,
          required: f.required,
        })),
      },
    });
  };

  const handleDeleteForm = (id: number) => {
    if (confirm('Are you sure you want to delete this form?')) {
      deleteForm({
        params: { id },
      });
    }
  };

  const handleAssignForm = () => {
    if (!selectedFormId || !selectedTargetId) {
      toast.error('Please select a target');
      return;
    }

    const formId = selectedFormId;

    switch (assignmentType) {
      case 'asset':
        assignToAsset({
          params: { formId, assetId: selectedTargetId },
          body: {},
        });
        break;
      case 'assetType':
        assignToAssetType({
          params: { formId, assetTypeId: Number(selectedTargetId) },
          body: {},
        });
        break;
      case 'tag':
        assignToTag({
          params: { formId, tagId: Number(selectedTargetId) },
          body: {},
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Booking Forms</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage custom forms for your bookings
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create Booking Form</DialogTitle>
              <DialogDescription>
                Add a new form with custom fields for your booking process
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="form-name">Form Name *</Label>
                  <Input
                    id="form-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Guest Information Form"
                  />
                </div>

                <div>
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Collect additional information from guests"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Form Fields</h3>

                  {formData.fields.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.fields.map((field, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{field.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {field.type} {field.required && '• Required'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 p-4 border rounded-lg">
                    <div>
                      <Label>Field Name *</Label>
                      <Input
                        value={newField.name}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                        placeholder="Number of guests"
                      />
                    </div>

                    <div>
                      <Label>Field Type *</Label>
                      <Select
                        value={newField.type}
                        onValueChange={(value: any) => setNewField({ ...newField, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="date_range">Date Range</SelectItem>
                          <SelectItem value="range">Range (Slider)</SelectItem>
                          <SelectItem value="boolean">Yes/No (Checkbox)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={newField.required}
                        onCheckedChange={(checked) =>
                          setNewField({ ...newField, required: checked as boolean })
                        }
                      />
                      <Label>Required field</Label>
                    </div>

                    <Button type="button" variant="outline" onClick={handleAddField} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateForm} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Form'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forms</CardTitle>
          <CardDescription>
            Manage your booking forms and assign them to assets, asset types, or tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No forms created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Form
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {form.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{form.fields?.length || 0} fields</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFormId(form.id);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteForm(form.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Form</DialogTitle>
            <DialogDescription>
              Choose where to assign this form
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Assignment Type</Label>
              <Select
                value={assignmentType}
                onValueChange={(value: any) => {
                  setAssignmentType(value);
                  setSelectedTargetId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Specific Asset</SelectItem>
                  <SelectItem value="assetType">Asset Type</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {assignmentType === 'asset' && 'Select Asset'}
                {assignmentType === 'assetType' && 'Select Asset Type'}
                {assignmentType === 'tag' && 'Select Tag'}
              </Label>
              <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose..." />
                </SelectTrigger>
                <SelectContent>
                  {assignmentType === 'asset' &&
                    assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  {assignmentType === 'assetType' &&
                    assetTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  {assignmentType === 'tag' &&
                    tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignForm}>Assign Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
