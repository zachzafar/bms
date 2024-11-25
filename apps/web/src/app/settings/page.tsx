'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AssetTypes from './AssetTypes';
import Categories from './Categories';
import BookingForms from './BookingForms';
import Groups from './Groups';
import GroupTypes from './GroupTypes';
import Properties from './Properties';
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
          <TabsTrigger value='properties'>Properties</TabsTrigger>
          <TabsTrigger value='categories'>Categories</TabsTrigger>
          <TabsTrigger value='booking-forms'>Booking Forms</TabsTrigger>
          <TabsTrigger value='group-types'>Goup Types</TabsTrigger>
          <TabsTrigger value='groups'>Groups</TabsTrigger>
        </TabsList>
        <TabsContent value='asset-types'>
          <AssetTypes />
        </TabsContent>
        <TabsContent value='properties'>
          <Properties />
        </TabsContent>
        <TabsContent value='categories'>
          <Categories />
        </TabsContent>
        <TabsContent value='booking-forms'>
          <BookingForms />
        </TabsContent>
        <TabsContent value='group-types'>
          <GroupTypes />
        </TabsContent>
        <TabsContent value='groups'>
          <Groups />
        </TabsContent>
      </Tabs>
    </main>
  );
}
