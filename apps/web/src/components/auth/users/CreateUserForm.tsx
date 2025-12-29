import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsertUserSchema } from '@repo/api-contract';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schema for creating users
const CreateUserSchema = InsertUserSchema.extend({
  roles: z.array(z.number()).default([])
});

type CreateUserFormData = z.infer<typeof CreateUserSchema>;

interface CreateUserFormProps {
  roles: { roleId: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserForm({ roles, onClose, onSuccess }: CreateUserFormProps) {
  const { mutate: createUserMutation, isPending } = authClient.users.createUser.useMutation();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roles: [],
      userType: 'system'
    },
  });

  const handleCreateUser: SubmitHandler<CreateUserFormData> = async (data) => {
    console.log("Submitting user:", data); // debug
    createUserMutation(
      { body: data },
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
        <form onSubmit={form.handleSubmit(handleCreateUser, (err) => {
          console.error("Validation errors:", err);
        })} className='space-y-4'>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="roles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roles</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      const roleId = Number(value);
                      const currentRoles = field.value || [];
                      if (!currentRoles.includes(roleId)) {
                        field.onChange([...currentRoles, roleId]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select roles" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.value?.map((roleId, index) => {
                    const roleName = roles.find(r => r.roleId)?.name || roleId;
                    return (
                      <div key={index} className="bg-gray-100 px-2 py-1 rounded-md flex items-center">
                        <span>{roleName}</span>
                        <button
                          type="button"
                          className="ml-2 text-red-500"
                          onClick={() => {
                            const newRoles = [...field.value];
                            newRoles.splice(index, 1);
                            field.onChange(newRoles);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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
