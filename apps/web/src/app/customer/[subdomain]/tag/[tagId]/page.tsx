'use client';

import { useParams, useRouter } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function TagBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const tagSlug = params.tagId as string;

  // Fetch tag details
    const { data: assetTypesResponse, isLoading, error: tagsError, refetch: refetchTags } = client.settings.assetType.customerGetAssetType.useQuery({
      queryKey: ['assetTypes-by-subdomain', subdomain, tagSlug],
      queryData: {
        params: { subdomain, id: tagSlug },
      },
    });

  const assetType  = assetTypesResponse?.status === 200 ? assetTypesResponse.body : null


  if (isLoading || !assetType ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!assetType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Category not found.</p>
              <Button onClick={() => router.push(`/customer/${subdomain}`)}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href={`/customer/${subdomain}`}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Link>

        <Card>
          {/* Tag Image */}
          {assetType.image ? (
            <div className="relative h-64 w-full">
              <Image
                src={assetType.image}
                alt={assetType.name}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center rounded-t-lg">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-24 w-24 opacity-20" />
                <span className="text-6xl font-bold opacity-20 mt-2">
                  {assetType.name.charAt(0)}
                </span>
              </div>
            </div>
          )}

          <CardHeader>
            <CardTitle className="text-3xl">{assetType.name}</CardTitle>
            {assetType.description && (
              <CardDescription className="text-lg">
                {assetType.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Asset type specifications */}
            {assetType.propertyValues && assetType.propertyValues.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Specifications</h3>
                <dl className="space-y-0">
                  {assetType.propertyValues.map((pv) => (
                    <div
                      key={pv.id}
                      className="flex justify-between py-2 border-b border-border"
                    >
                      <dt className="font-medium text-foreground">{pv.property.name}:</dt>
                      <dd className="text-muted-foreground">{pv.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">How it works</h3>
              <p className="text-muted-foreground">
                When you book this category, we'll automatically assign the best available option for your selected dates.
                You don't need to choose a specific item - we handle the assignment for you.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(`/customer/${subdomain}/tag/${tagSlug}/book`)}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
