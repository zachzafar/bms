'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AssetTypes from './assetComponents/AssetTypes';
import Tags from './assetComponents/Tags';
import BookingForms from './assetComponents/BookingForms';
import { useState } from 'react';
import Properties from './assetComponents/Properties';

export default function AssetConfig({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState('asset-types');

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Asset Configuration</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList>
          <TabsTrigger value='asset-types'>Asset Types</TabsTrigger>
          <TabsTrigger value='booking-forms'>Booking Forms</TabsTrigger>
          <TabsTrigger value="properties">Fields</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <TabsContent value='asset-types'>
          <AssetTypes tenantId={tenantId} />
        </TabsContent>
        <TabsContent value='booking-forms'>
          <BookingForms tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="properties">
           <Properties tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="tags">
           <Tags tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
