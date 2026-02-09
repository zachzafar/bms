'use client';

import { useState } from 'react';
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
  const ownerId = Number(params.id);

  const { data: ownerData, isLoading } = authClient.owners.getOwner.useQuery({
    queryKey: ['owner', ownerId],
    queryData: {
      params: { id: ownerId },
    },
    enabled: !!tenant,
  });

  if (isLoading) return <Loading />;

  const selected = ownerData?.status === 200 ? ownerData.body : null;
  const displayName = selected?.name || selected?.email || String(ownerId);

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
          <Details ownerId={ownerId} />
        </TabsContent>
        <TabsContent value="assets">
          <Assets ownerId={ownerId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
