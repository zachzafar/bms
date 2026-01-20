'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Asset = {
  id: string;
  name: string;
  description?: string;
  images: string[];
  properties: Array<{
    id: number;
    name: string;
    value: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export default function CustomerAssetListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');

  const { data: response, isLoading, error, refetch } = client.assets.getAssetsBySubdomain.useQuery({
    queryKey: ['assets-by-subdomain', subdomain, currentPage, pageSize],
    queryData: {
      params: { subdomain },
      query: { page: currentPage, pageSize },
    },
  });

  const assets = response?.status === 200 ? response.body.data : [];
  const pagination = assets.length > 0 ? assets[0].pagination : null;

  const goToPage = (page: number) => {
    router.push(`/customer/${subdomain}?page=${page}&pageSize=${pageSize}`);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { totalPages } = pagination;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Failed to load assets. Please try again.</p>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Available Assets</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our selection and book what you need
          </p>
        </div>

        {/* Assets Grid */}
        {assets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground text-lg">No assets available at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/customer/${subdomain}/${asset.id}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                    {/* Asset Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary to-primary flex items-center justify-center overflow-hidden">
                      {asset.images.length > 0 ? (
                        <Image
                          src={asset.images[0]}
                          alt={asset.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-white text-6xl font-bold opacity-20">
                          {asset.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {asset.name}
                      </CardTitle>
                      {asset.description && (
                        <CardDescription className="line-clamp-2">
                          {asset.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent>
                      {/* Tags */}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="secondary">
                              {tag.name}
                            </Badge>
                          ))}
                          {asset.tags.length > 3 && (
                            <Badge variant="outline">
                              +{asset.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary">
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => pagination.hasPreviousPage && goToPage(currentPage - 1)}
                        className={!pagination.hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => pagination.hasNextPage && goToPage(currentPage + 1)}
                        className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                {/* Results Info */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, pagination.totalCount)} of{' '}
                  {pagination.totalCount} assets
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}