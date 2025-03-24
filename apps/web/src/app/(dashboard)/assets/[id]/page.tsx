'use client';

import { useState } from 'react';
import  AssetAvailabilityCalendar  from '@/app/(dashboard)/assets/[id]/AssetAvailabilityCalendar';
import AssetTypePropertiesForm from './AssetTypePropertiesForm';
import { useParams } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import Loading from '@/components/custom/Loading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BasicInfo from './BasicInfo';
import Images from './Images';
import AssetBookings from '@/components/custom/AssetBookings';
import { StorageService } from '@/lib/api/storage';

export default function AssetDetailsPage() {
  const tenant = StorageService.getTenant();
  const [activeTab,setActiveTab] = useState("basic-information")
  const params = useParams();
  const { data, isLoading} = authClient.assets.getAsset.useQuery({
    queryKey: ["assets", params.id as string],
    queryData:  {
      params: {
        id: params.id as string,
      },
    },
    enabled: !!tenant
  });

  const asset = data?.status === 200 ? data.body : null

  if (isLoading || !asset) {
    return <Loading/>
  }

return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>
          Asset Details: {asset?.name}
        </h1>
      </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList>
              <TabsTrigger value='basic-information'>Basic Information</TabsTrigger>
              <TabsTrigger value='detailed-information'>Details Information</TabsTrigger>
              <TabsTrigger value="availabilities">Availabilities</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            <TabsContent value='basic-information'>
              <BasicInfo asset={asset}/>
            </TabsContent>
            <TabsContent value='detailed-information'>
              <AssetTypePropertiesForm asset={asset}/>
            </TabsContent>
            <TabsContent value="availabilities">
               <AssetAvailabilityCalendar asset={asset}/>
            </TabsContent>
            <TabsContent value="bookings">
               <AssetBookings asset={asset} />
            </TabsContent>
            <TabsContent value="images">
               <Images asset={asset}/>
            </TabsContent>
          </Tabs>
    </>
  );
}
