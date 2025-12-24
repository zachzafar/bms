'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import Details from './Details';
import Bookings from './Bookings';
import Billing from './Billing';

export default function CustomerDetailsPage() {
  const tenant = StorageService.getTenant();
  const params = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const userId = params.id as string;

  // Lightweight header hydration
  const { data: customersData, isLoading: customersLoading } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
    enabled: !!tenant,
  });
  const customers = customersData?.body ?? [];
  const selected = useMemo(() => customers.find((c: any) => c.user.id === userId), [customers, userId]);

  if (customersLoading) return <Loading />;

  const displayName = selected?.user?.name || selected?.user?.email || userId;

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Customer Details: {displayName}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Details userId={userId} />
        </TabsContent>
        <TabsContent value="bookings">
          <Bookings userId={userId} />
        </TabsContent>
        <TabsContent value="billing">
          <Billing userId={userId} />
        </TabsContent>
      </Tabs>
    </>
  );
}