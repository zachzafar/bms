'use client';

import { client } from '@/lib/api/publicClient';

export function useBookingPriceQuote(
  subdomain: string,
  assetTypeId: number,
  from: Date | undefined,
  to: Date | undefined,
  selectedAddons: Record<number, number>,
) {
  const addons = Object.entries(selectedAddons)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ addonItemId: Number(id), quantity: qty }));

  const enabled = !!subdomain && !!assetTypeId && !!from && !!to;

  const { data, isLoading } = client.booking.calculatePublicPriceQuote.useQuery({
    queryKey: ['price-quote', subdomain, assetTypeId, from?.toISOString(), to?.toISOString(), JSON.stringify(addons)],
    queryData: {
      params: { subdomain },
      query: {
        assetTypeId,
        startDate: from!,
        endDate: to!,
        addons: addons.length > 0 ? JSON.stringify(addons) : undefined,
      },
    },
    enabled,
  });

  const quote = data?.status === 200 ? data.body : null;

  return { quote, isLoading: enabled && isLoading, error: data?.status === 404 ? data.body.message : null };
}
