'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import Image from 'next/image';

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

type PaginationData = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load assets. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Available Assets</h1>
          <p className="mt-2 text-lg text-gray-600">
            Browse our selection and book what you need
          </p>
        </div>

        {/* Assets Grid */}
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No assets available at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/customer/${subdomain}/${asset.id}`}
                  className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Asset Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
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

                  {/* Asset Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {asset.name}
                    </h3>
                    {asset.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {asset.description}
                      </p>
                    )}

                    {/* Tags */}
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {asset.tags.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                            +{asset.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Info */}
            {pagination && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, pagination.totalCount)} of{' '}
                {pagination.totalCount} assets
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
