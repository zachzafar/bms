'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authClient } from '@/lib/api/publicClient';
import { MAINTENANCE_QUERY_KEY } from '@/lib/api/queryKeys';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UpdateMaintenanceTaskSchema, UpdateMaintenanceTask } from '@/lib/api-contract';
import {toast} from "sonner"
import AddMaintenanceFile from './AddMaintenanceFile';

export default function MaintenanceDetails() {
  const params = useParams();
  const maintenanceId = params.id as string;

  const { data: maintenanceData } = authClient.maintenance.getMaintenance.useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, maintenanceId],
    queryData: {
      params: { id: maintenanceId },
    },
  });


  const { mutate: updateMaintenance, isPending: isUpdating } = 
    authClient.maintenance.updateMaintenance.useMutation();


  const form = useForm<UpdateMaintenanceTask>({
    resolver: zodResolver(UpdateMaintenanceTaskSchema),
    defaultValues: {
      title: maintenanceData?.body.title || '',
      description: maintenanceData?.body.description || '',
      cost: maintenanceData?.body.cost || 0,
      status: maintenanceData?.body.status || 'AWAITING',
    },
  });

  const onSubmit = (data: UpdateMaintenanceTask) => {
    console.log('data', data);
    updateMaintenance({
      params: { id: maintenanceId },
      body: data
    },{
      onSuccess: () => {
        toast.success('Maintenance updated successfully');
      }
    },
  );
  };


  useEffect(() => {
    if(maintenanceData?.body){
      form.reset({
        title: maintenanceData?.body.title,
        description: maintenanceData?.body.description,
        cost: maintenanceData?.body.cost,
        status: maintenanceData?.body.status,
      })
    }
  },[maintenanceData,form])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Maintenance Details</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AWAITING">Awaiting</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Maintenance'}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
            <AddMaintenanceFile />
      </div>
    </div>
  );
}