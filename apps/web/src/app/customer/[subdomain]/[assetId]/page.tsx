'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';

export default function CustomerAssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const assetId = params.assetId as string;

  const { data: response, isLoading, error } = client.assets.getAssetDetailsBySubdomain.useQuery({
    queryKey: ['asset-details', subdomain, assetId],
    queryData: {
      params: { subdomain, assetId },
    },
  });

  const asset = response?.status === 200 ? response.body : null;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {response?.status !== 200 ? 'Asset not found' : 'Failed to load asset details'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {response?.status !== 200
                  ? 'The asset you\'re looking for doesn\'t exist or has been removed.'
                  : 'Please try again later.'}
              </p>
              <Button asChild>
                <Link href={`/customer/${subdomain}`}>
                  Back to Assets
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/customer/${subdomain}`}
          className="inline-flex items-center text-primary hover:text-primary mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to all assets
        </Link>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Images */}
            <div>
              {/* Main Image */}
              <div className="relative h-96 bg-primary rounded-lg overflow-hidden mb-4">
                {asset.images.length > 0 ? (
                  <Image
                    src={asset.images[selectedImageIndex].filePath}
                    alt={asset.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-white text-9xl font-bold opacity-20">
                      {asset.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {asset.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {asset.images.map((image, index) => (
                    <Button
                      key={image.id}
                      variant="outline"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 p-0 overflow-hidden ${
                        selectedImageIndex === index
                          ? 'ring-2 ring-primary border-primary'
                          : ''
                      }`}
                    >
                      <Image
                        src={image.filePath}
                        alt={`${asset.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div>
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl">{asset.name}</CardTitle>
              </CardHeader>

              <CardContent className="px-0">
                {/* Tags */}
                {/* {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {asset.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )} */}

                {/* Description */}
                {asset.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
                    <p className="text-muted-foreground leading-relaxed">{asset.description}</p>
                  </div>
                )}

                <Separator className="my-6" />

                {/* Properties */}
                {asset.properties.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-3">Specifications</h2>
                    <dl className="space-y-2">
                      {asset.properties.map((prop) => (
                        <div
                          key={prop.id}
                          className="flex justify-between py-2 border-b border-border"
                        >
                          <dt className="font-medium text-foreground">{prop.assetProperty.name}:</dt>
                          <dd className="text-foreground">{prop.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Book Now Button */}
                <Button asChild size="lg" className="w-full">
                  <Link href={`/customer/${subdomain}/${assetId}/book`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Now
                  </Link>
                </Button>

                <p className="mt-3 text-sm text-muted-foreground text-center">
                  Check availability and make a reservation
                </p>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}