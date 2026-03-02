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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'draft', 'approved', 'partial', 'paid', 'void'] as const;

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid': return 'default';
    case 'approved':
    case 'partial': return 'secondary';
    case 'void': return 'destructive';
    default: return 'outline';
  }
}

function formatCurrency(amount: string | number | null | undefined) {
  if (amount == null) return '—';
  return `$${Number(amount).toFixed(2)}`;
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OwnerInvoicesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const pageSize = 10;

  const { data: response, isLoading } = authClient.billing.getOwnerInvoices.useQuery({
    queryKey: ['owner-invoices', page, status],
    queryData: {
      query: {
        page,
        pageSize,
        status: status === 'all' ? undefined : status,
      },
    },
  });

  const invoices = response?.status === 200 ? response.body.data : [];
  const pagination = response?.status === 200 ? response.body.pagination : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Invoices</h2>
        <p className="text-muted-foreground mt-2">View invoices generated for your properties</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>
                {pagination ? `${pagination.totalCount} total invoices` : 'Loading…'}
              </CardDescription>
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                {status !== 'all'
                  ? 'Try changing the status filter'
                  : 'No invoices have been issued for your properties yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber || `#${invoice.id}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
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
                    {pagination.totalCount} invoices
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
