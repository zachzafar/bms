'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { Search, Loader2, Home, Eye } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function OwnerAssetsPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;

  const { data: assetsResponse, isLoading } = authClient.assets.getOwnerAssets.useQuery({
    queryKey: ['owner-assets', page, search],
    queryData: {
      query: {
        page,
        pageSize,
        search: search || undefined,
      },
    },
  });

  const assets = assetsResponse?.status === 200 ? assetsResponse.body.data : [];
  const pagination = assetsResponse?.status === 200 ? assetsResponse.body.pagination : null;

  const handleViewDetails = (assetId: string) => {
    router.push(`/owner/${subdomain}/dashboard/assets/${assetId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">My Assets</h2>
        <p className="text-muted-foreground mt-2">View your property assets</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">No assets found</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              {search ? 'Try adjusting your search' : 'You have no assets assigned'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset: any) => (
              <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Asset Image */}
                <div className="relative h-48 bg-muted">
                  {asset.images && asset.images.length > 0 ? (
                    <Image
                      src={asset.images[0].filePath}
                      alt={asset.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Asset Info */}
                <CardHeader>
                  <CardTitle className="text-lg">{asset.name}</CardTitle>
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
                      {asset.tags.slice(0, 3).map((tag: any) => (
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

                  {/* View Details Button */}
                  <Button
                    onClick={() => handleViewDetails(asset.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                  {pagination.totalCount} assets
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
