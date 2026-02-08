'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import CustomerTypes from './CustomerTypes';

export default function UserConfig() {
  const [activeTab, setActiveTab] = useState('customer-types');

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>User Configuration</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList>
          <TabsTrigger value='customer-types'>Customer Types</TabsTrigger>
        </TabsList>
        <TabsContent value='customer-types'>
          <CustomerTypes />
        </TabsContent>
      </Tabs>
    </>
  );
}
