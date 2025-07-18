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
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { InsertTag, InsertTagSchema } from '@repo/api-contract';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';


export default function Tags() {

  const queryClient = useQueryClient();

  const { data: tags, isLoading } = authClient.settings.tags.getTags.useQuery({
    queryKey: ['tags']
  });

  const { mutate: createTag } = authClient.settings.tags.createTag.useMutation({
  onSuccess: () => {
    toast('Tag created successfully');
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    form.reset();
  },
  onError: (error) => {
    toast(`Error creating tag: ${error}`);
  }
});

  const { mutate: deleteTag } = authClient.settings.tags.deleteTag.useMutation({
  onSuccess: () => {
    toast('Tag deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['tags'] }); // refetch tags
  },
  onError: (error: any) => {
    toast(`Error deleting tag: ${error.message}`);
  }
});

  const form = useForm<InsertTag>({
    resolver: zodResolver(InsertTagSchema),
  });

  const processForm: SubmitHandler<InsertTag> = async (data) => {
    createTag({
      body: data
    }, {
      onSuccess: (response) => {
        console.log('response', response);
      }
    });
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
                      <Input placeholder="Enter tag name" {...field} />
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
                        placeholder="Enter tag description" 
                        {...field}
                        value={field.value ?? ''} // Convert null to empty string
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags?.status === 200 ? (
                tags.body.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>{tag.description}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTag({ params: { id: String(tag.id) }, body: {} })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No tags found
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
