'use client';

import { useState } from 'react';
import { authClient } from '@/lib/api/publicClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DollarSign, Loader2 } from 'lucide-react';

function formatCurrency(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  const n = Number(amount);
  return n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `$${n.toFixed(2)}`;
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getTypeVariant(type: string | null | undefined): 'default' | 'destructive' | 'outline' {
  if (!type) return 'outline';
  return type.toLowerCase() === 'refund' ? 'destructive' : 'default';
}

export default function OwnerPaymentsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: response, isLoading } = authClient.billing.getOwnerPayments.useQuery({
    queryKey: ['owner-payments', page],
    queryData: {
      query: { page, pageSize },
    },
  });

  const payments = response?.status === 200 ? response.body.data : [];
  const pagination = response?.status === 200 ? response.body.pagination : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Payments</h2>
        <p className="text-muted-foreground mt-2">View payments received for your properties</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            {pagination ? `${pagination.totalCount} total payments` : 'Loading…'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                No payments have been recorded for your properties yet
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.reference || `PMT-${payment.id}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeVariant(payment.type)}>
                            {payment.type || 'Payment'}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.paymentMethod || '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => pagination.hasPreviousPage && setPage(page - 1)}
                          className={!pagination.hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map((n) => (
                        <PaginationItem key={n}>
                          <PaginationLink
                            onClick={() => setPage(n)}
                            isActive={n === page}
                            className="cursor-pointer"
                          >
                            {n}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => pagination.hasNextPage && setPage(page + 1)}
                          className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} payments
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
