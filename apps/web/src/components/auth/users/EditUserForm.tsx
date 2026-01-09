import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsertUserSchema, SelectUser } from '@repo/api-contract';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schema for updating users
const UpdateUserSchema = z.object({
  user: InsertUserSchema.partial(),
  roles: z.array(z.number()).default([])
});

type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;

interface EditUserFormProps {
  user: SelectUser & { roles?: number[] };
  roles: { roleId: number; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserForm({ user, roles, onClose, onSuccess }: EditUserFormProps) {
  const { mutate: updateUserMutation, isPending } = authClient.users.updateUser.useMutation();

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      user: {
        name: user.name,
        email: user.email,
        password: ''
      },
      roles: user.roles || []
    },
  });

  const handleUpdateUser: SubmitHandler<UpdateUserFormData> = async (data) => {
    if (user.id) {
      updateUserMutation(
        {
          params: { id: user.id },
          body: data,
        },
        {
          onSuccess: () => {
            toast.success('User updated successfully');
            form.reset();
            onSuccess();
          },
          onError: (error) => {
            console.error('Update error:', error);
            toast.error('Failed to update user');
          },
        }
      );
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>Update user details below</DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdateUser)} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name="user.name"
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
              name="user.email"
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
              name="user.password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank to keep current password
                  </FormDescription>
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
                        <SelectItem key={role.roleId} value={role.roleId.toString()}>
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
              Update User
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
