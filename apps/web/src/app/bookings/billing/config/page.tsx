'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import PaymentMethods from './PaymentMethods';

export default function BillingConfig() {
  const [activeTab, setActiveTab] = useState('payment-methods');

  return (
    <>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Billing Configuration</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList>
          <TabsTrigger value='payment-methods'>Payment Methods</TabsTrigger>
        </TabsList>
        <TabsContent value='payment-methods'>
          <PaymentMethods />
        </TabsContent>
      </Tabs>
    </>
  );
}