'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function OwnerPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Payments</h2>
        <p className="text-muted-foreground mt-2">View all payments for your properties</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Payment tracking will be available soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <DollarSign className="h-20 w-20 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Payment tracking and management features are currently under development. You'll be able to view payment history and transaction details once this feature is available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
