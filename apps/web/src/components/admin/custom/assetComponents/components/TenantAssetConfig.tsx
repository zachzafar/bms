'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AssetTypes from '../config/AssetTypes';
import Tags from '../config/Tags';
import BookingForms from '../config/BookingForms';
import { useState } from 'react';
import Properties from '../config/Properties';

export default function AssetConfig({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState('asset-types');

  return (
    <div className="space-y-6">
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl text-white'>Asset Configuration</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value='asset-types' className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Asset Types</TabsTrigger>
          <TabsTrigger value='booking-forms' className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Booking Forms</TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Fields</TabsTrigger>
          <TabsTrigger value="tags" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Tags</TabsTrigger>
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
    </div>
  );
}
