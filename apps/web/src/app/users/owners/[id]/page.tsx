'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import Details from './Details';
import Assets from './Assets';

export default function OwnerDetailsPage() {
  const tenant = StorageService.getTenant();
  const params = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const userId = params.id as string;

  // Lightweight header hydration
  const { data: ownersData, isLoading: ownersLoading } = authClient.users.getOwners.useQuery({
    queryKey: ['owners'],
    enabled: !!tenant,
  });
  const owners = ownersData?.body ?? [];
  const selected = useMemo(() => owners.find((o: any) => o.user.id === userId), [owners, userId]);

  if (ownersLoading) return <Loading />;

  const displayName = selected?.user?.name || selected?.user?.email || userId;

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Owner Details: {displayName}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Details userId={userId} />
        </TabsContent>
        <TabsContent value="assets">
          <Assets userId={userId} />
        </TabsContent>
      </Tabs>
    </>
  );
}