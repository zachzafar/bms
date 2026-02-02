'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { ArrowLeft, Home, Loader2, Calendar, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function OwnerAssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const assetId = params.id as string;

  const { data: assetResponse, isLoading } = authClient.assets.getOwnerAsset.useQuery({
    queryKey: ['owner-asset', assetId],
    queryData: {
      params: { id: assetId },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (assetResponse?.status !== 200 || !assetResponse?.body) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">Asset not found</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              This asset does not exist or you do not have access to it
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const asset = assetResponse.body;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Asset Name */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">{asset.name}</h2>
        {asset.description && (
          <p className="text-muted-foreground mt-2">{asset.description}</p>
        )}
      </div>

     

      {/* Properties */}
      {asset.propertyValues && asset.propertyValues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Asset specifications and details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asset.propertyValues.map((prop: any) => (
                <div key={prop.assetPropertyId} className="border-b border-border pb-3 last:border-0">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {prop.assetProperty.name}
                  </dt>
                  <dd className="text-base text-foreground mt-1">
                    {prop.value || 'N/A'}
                  </dd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {/* {asset.tags && asset.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Bookings
            </CardTitle>
            <CardDescription>View bookings for this asset</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/owner/${subdomain}/dashboard/bookings?assetId=${asset.id}`}>
              <Button variant="outline" className="w-full">
                View Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Maintenance
            </CardTitle>
            <CardDescription>View maintenance tasks for this asset</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/owner/${subdomain}/dashboard/maintenance?assetId=${asset.id}`}>
              <Button variant="outline" className="w-full">
                View Maintenance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Asset Info */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Asset ID</dt>
              <dd className="text-base text-foreground mt-1 font-mono text-sm">{asset.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="text-base text-foreground mt-1">
                {new Date(asset.createdAt).toLocaleDateString()}
              </dd>
            </div>
            {asset.updatedAt && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="text-base text-foreground mt-1">
                  {new Date(asset.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Availability</dt>
              <dd className="text-base text-foreground mt-1">
                <Badge variant={asset.available ? 'default' : 'destructive'}>
                  {asset.available ? 'Available' : 'Unavailable'}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
       {/* Images */}
      {asset.images && asset.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {asset.images.map((image: any, index: number) => (
                <div key={image.id} className="relative h-64 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={image.filePath}
                    alt={`${asset.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
