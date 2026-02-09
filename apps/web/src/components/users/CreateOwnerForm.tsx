import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsertOwner, InsertOwnerSchema, InsertUserSchema } from '@repo/api-contract';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';





interface CreateUserFormProps {
  roles: { roleId: number; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserForm({ roles, onClose, onSuccess }: CreateUserFormProps) {
  const { mutate: createOwnerMutation, isPending } = authClient.owners.createOwner.useMutation();

  const form = useForm<InsertOwner>({
    resolver: zodResolver(InsertOwnerSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const handleCreateUser: SubmitHandler<InsertOwner> = async (data) => {
    createOwnerMutation(
      {
        body: data,
      },
      {
        onSuccess: () => {
          toast.success('User created successfully');
          form.reset();
          onSuccess();
        },
        onError: (error) => {
          console.error('Create error:', error);
          toast.error('Failed to create user');
        },
      }
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New User</DialogTitle>
        <DialogDescription>Enter user details below</DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreateUser)} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           
          </div>


          <div className='flex justify-end space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              Add User
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}