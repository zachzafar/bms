'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import Image from 'next/image';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">
            {response?.status !== 200 ? 'Asset not found' : 'Failed to load asset details. Please try again.'}
          </p>
          <Link
            href={`/customer/${subdomain}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Assets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/customer/${subdomain}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all assets
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Images */}
            <div>
              {/* Main Image */}
              <div className="relative h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden mb-4">
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
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? 'border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image.filePath}
                        alt={`${asset.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{asset.name}</h1>

              {/* Tags */}
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {asset.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600 leading-relaxed">{asset.description}</p>
                </div>
              )}

              {/* Properties */}
              {asset.properties.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h2>
                  <dl className="space-y-2">
                    {asset.properties.map((prop) => (
                      <div
                        key={prop.id}
                        className="flex justify-between py-2 border-b border-gray-200"
                      >
                        <dt className="font-medium text-gray-700">{prop.assetProperty.name}:</dt>
                        <dd className="text-gray-900">{prop.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Book Now Button */}
              <Link
                href={`/customer/${subdomain}/${assetId}/book`}
                className="block w-full py-3 px-6 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Book Now
              </Link>

              <p className="mt-3 text-sm text-gray-500 text-center">
                Check availability and make a reservation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
