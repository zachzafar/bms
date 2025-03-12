'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AssetTypes from './AssetTypes';
import Tags from './Tags';
import BookingForms from './BookingForms';
import { useState } from 'react';
import Properties from './Properties';

export default function Settings() {
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
        </TabsList>
        <TabsContent value='asset-types'>
          <AssetTypes />
        </TabsContent>
        <TabsContent value='booking-forms'>
          <BookingForms />
        </TabsContent>
        <TabsContent value="properties">
           <Properties/>
        </TabsContent>
      </Tabs>
    </>
  );
}
