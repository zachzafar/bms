'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function OwnerInvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Invoices</h2>
        <p className="text-slate-600 mt-2">View all invoices for your properties</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Invoice management will be available soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <FileText className="h-20 w-20 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">Coming Soon</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Invoice management features are currently under development. You'll be able to view and download invoices for your properties once this feature is available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
