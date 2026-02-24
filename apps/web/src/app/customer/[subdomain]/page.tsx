'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, ImageIcon } from 'lucide-react';
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
  slug?: string | null;
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

type Tag = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
};

type PaginationData = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function CustomerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');

  // First, fetch tenant settings to check if they book by tag
  const { data: tenantResponse, isLoading: isTenantLoading } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-settings', subdomain],
    queryData: {
      params: { subdomain },
    },
  });

  const booksByTag = tenantResponse?.status === 200 ? tenantResponse.body.booksByTagOnCustomerPage : false;

  // Fetch assets (when not booking by tag)
  const { data: assetsResponse, isLoading: isAssetsLoading, error: assetsError, refetch: refetchAssets } = client.assets.getAssetsBySubdomain.useQuery({
    queryKey: ['assets-by-subdomain', subdomain, currentPage, pageSize],
    queryData: {
      params: { subdomain },
      query: { page: currentPage, pageSize },
    },
    enabled: !booksByTag && tenantResponse?.status === 200,
  });

  // Fetch tags (when booking by tag)
  const { data: assetTypesResponse, isLoading: isTagsLoading, error: tagsError, refetch: refetchTags } = client.settings.assetType.customerGetAssetTypes.useQuery({
    queryKey: ['assetTypes-by-subdomain', subdomain, currentPage, pageSize],
    queryData: {
      params: { subdomain },
      query: { page: currentPage, pageSize },
    },
    enabled: booksByTag && tenantResponse?.status === 200,
  });

  const assets = assetsResponse?.status === 200 ? assetsResponse.body.data : [];
  const assetPagination = assets.length > 0 ? assets[0].pagination : null;

  const assetTypes = assetTypesResponse?.status === 200 ? assetTypesResponse.body.data : [];
  const assetTypePagination = assetTypesResponse?.status === 200 ? assetTypesResponse.body.pagination : null;

  const pagination: PaginationData | null = booksByTag ? assetTypePagination : assetPagination;
  const isLoading = isTenantLoading || (booksByTag ? isTagsLoading : isAssetsLoading);
  const error = booksByTag ? tagsError : assetsError;
  const refetch = booksByTag ? refetchTags : refetchAssets;

  const goToPage = (page: number) => {
    router.push(`/customer/${subdomain}?page=${page}&pageSize=${pageSize}`);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { totalPages } = pagination;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

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
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
              <p className="text-destructive mb-4">Failed to load. Please try again.</p>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Tags View
  if (booksByTag) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Browse Categories</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Select a category to view available options
            </p>
          </div>

          {/* Tags Grid */}
          {assetTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">No categories available at the moment.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assetTypes.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/customer/${subdomain}/tag/${tag.id}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                      {/* Tag Image */}
                      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                        {tag.image ? (
                          <Image
                            src={tag.image}
                            alt={tag.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-16 w-16 opacity-20" />
                            <span className="text-4xl font-bold opacity-20 mt-2">
                              {tag.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {tag.name}
                        </CardTitle>
                        {tag.description && (
                          <CardDescription className="line-clamp-2">
                            {tag.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary">
                          Browse Options
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

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} categories
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Render Assets View (default)
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
                  href={`/customer/${subdomain}/${asset.slug ?? asset.id}`}
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
                      {/* {asset.tags && asset.tags.length > 0 && (
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
                      )} */}

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
