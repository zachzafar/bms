'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/api/publicClient';
import { Wrench, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
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

export default function OwnerMaintenancePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;

  const { data: maintenanceResponse, isLoading } = authClient.maintenance.getOwnerMaintenances.useQuery({
    queryKey: ['owner-maintenance', page, search],
    queryData: {
      query: {
        page,
        pageSize,
        search: search || undefined,
      },
    },
  });

  const maintenanceTasks = maintenanceResponse?.status === 200 ? maintenanceResponse.body.data : [];
  const pagination = maintenanceResponse?.status === 200 ? maintenanceResponse.body.pagination : null;

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Maintenance</h2>
        <p className="text-muted-foreground mt-2">View all maintenance tasks for your properties</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Maintenance Tasks</CardTitle>
              <CardDescription>
                {pagination ? `${pagination.totalCount} total tasks` : 'Loading...'}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : maintenanceTasks.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">No maintenance tasks found</h3>
              <p className="text-muted-foreground">
                {search ? 'Try adjusting your search criteria' : 'No maintenance tasks have been created yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceTasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {task.description || 'No description'}
                        </TableCell>
                        <TableCell>{task.assetId || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityVariant(task.priority || 'low')}>
                            {task.priority || 'low'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(task.status || 'pending')}>
                            {(task.status || 'pending').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
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

                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setPage(pageNumber)}
                              isActive={pageNumber === page}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => pagination.hasNextPage && setPage(page + 1)}
                          className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>

                  <div className="mt-4 text-center text-sm text-slate-600">
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} tasks
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
