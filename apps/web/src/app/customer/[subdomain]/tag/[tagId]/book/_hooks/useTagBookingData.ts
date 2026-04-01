'use client';

import { client } from '@/lib/api/publicClient';
import { parseAsLocalDate } from '@/lib/utils/date';
import { BlockedDateRange } from '@/components/ui/date-range-picker';

export function useTagBookingData(subdomain: string, tagSlug: string) {
  const { data: tenantResponse, isLoading: isTenantLoading } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-settings', subdomain],
    queryData: { params: { subdomain } },
  });
  const tenantId = tenantResponse?.status === 200 ? tenantResponse.body.id : null;

  const { data: assetTypesResponse, isLoading: isAssetTypeLoading } = client.settings.assetType.customerGetAssetType.useQuery({
    queryKey: ['assetTypes-by-subdomain', subdomain, tagSlug],
    queryData: { params: { subdomain, id: tagSlug } },
  });
  const assetType = assetTypesResponse?.status === 200 ? assetTypesResponse.body : null;
  const assetTypeId = assetType?.id ?? 0;

  const { data: formsResponse, isLoading: isLoadingForms } = client.settings.form.getFormsForAssetTypePublic.useQuery({
    queryKey: ['forms-for-asset-type', assetTypeId],
    queryData: { params: { assetTypeId } },
    enabled: !!assetTypeId,
  });
  const forms = formsResponse?.status === 200 ? formsResponse.body.forms : [];

  const { data: blockedDatesResponse } = client.blockedDates.getBlockedDatesForAssetTypePublic.useQuery({
    queryKey: ['blocked-dates-tag', assetTypeId],
    queryData: { params: { assetTypeId }, query: {} },
    enabled: !!assetTypeId,
  });
  const blockedDates: BlockedDateRange[] = blockedDatesResponse?.status === 200
    ? blockedDatesResponse.body.map((d) => ({
        startDate: parseAsLocalDate(d.start as unknown as string),
        endDate: parseAsLocalDate(d.end as unknown as string),
      }))
    : [];

  const { data: addonsResponse } = client.addons.getPublicAddons.useQuery({
    queryKey: ['public-addons', subdomain],
    queryData: { params: { subdomain } },
    enabled: !!subdomain,
  });
  const availableAddons = addonsResponse?.status === 200 ? addonsResponse.body : [];

  return {
    tenantId,
    assetType,
    assetTypeId,
    forms,
    blockedDates,
    availableAddons,
    isLoading: isTenantLoading || isAssetTypeLoading || isLoadingForms,
  };
}
