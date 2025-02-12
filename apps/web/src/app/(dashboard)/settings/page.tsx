'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AssetTypes from './AssetTypes';
import Categories from './Categories';
import BookingForms from './BookingForms';
import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('asset-types');

  return (
    <main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6'>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Settings</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList>
          <TabsTrigger value='asset-types'>Asset Types</TabsTrigger>
          <TabsTrigger value='tags'>Tags</TabsTrigger>
          <TabsTrigger value='booking-forms'>Booking Forms</TabsTrigger>
        </TabsList>
        <TabsContent value='asset-types'>
          <AssetTypes />
        </TabsContent>
        <TabsContent value='tags'>
          <Categories />
        </TabsContent>
        <TabsContent value='booking-forms'>
          <BookingForms />
        </TabsContent>
      </Tabs>
    </main>
  );
}
