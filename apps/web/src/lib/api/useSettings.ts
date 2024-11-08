// useProperties.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { delay, mockApiService } from './mock';
import { AssetProperty, AssetTypeWithProperties, InsertAssetProperty, InsertAssetType, PatchAssetProperty, PatchAssetType } from '@repo/drizzle/src/schema/settings';
import { AssetType } from '@repo/drizzle/src/schema/settings/types';
import { mockAssetTypes } from './mock/settings/data';
import { create } from 'domain';

// Fetch all properties
export const useProperties = () => {
  return useQuery<AssetProperty[], Error>({
    queryKey: ['properties'],
    queryFn: mockApiService.getProperties,
  });
};

// Add a new property
export const useAddProperty = () => {
  const queryClient = useQueryClient();
  return useMutation<AssetProperty, Error, InsertAssetProperty>({
    mutationFn: mockApiService.addProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

// Update an existing property
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  return useMutation<AssetProperty, Error,  PatchAssetProperty >({
    mutationFn: (data) => mockApiService.updateProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

// Delete a property
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: mockApiService.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};


//////////////////////////////////////// AssetTypes.tsx ////////////////////////////////////////

export const useAssetTypes = () => {
  return useQuery<AssetTypeWithProperties[], Error>({
    queryKey: ['assetTypes'],
    queryFn: async () => {
      await delay(500); // Simulate network delay
      return mockAssetTypes;
    },
  });
};

// Add a new asset type
export const useAddAssetType = () => {
  const queryClient = useQueryClient();
  return useMutation<AssetTypeWithProperties, Error, InsertAssetType>({
    mutationFn: async (newAssetType) => {
      await delay(500);
      const assetType = { 
        ...newAssetType, 
        id: Date.now(), 
        createdAt: new Date(), 
        updatedAt: null,
        description: null,
        bookingFormId: null,

      };
      mockAssetTypes.push(assetType);
      return assetType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
    },
  });
};

// Update an existing asset type
export const useUpdateAssetType = () => {
  const queryClient = useQueryClient();
  return useMutation<AssetTypeWithProperties, Error, PatchAssetType>({
    mutationFn: async (data) => {
      await delay(500);
      const index = mockAssetTypes.findIndex(at => at.id === data.id);
      if (index === -1) throw new Error('Asset type not found');
      const updatedAssetType = { ...mockAssetTypes[index],...data, updatedAt: new Date()};
      mockAssetTypes[index] = updatedAssetType;
      return updatedAssetType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
    },
  });
};

// Delete an asset type
export const useDeleteAssetType = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await delay(500);
      const index = mockAssetTypes.findIndex(at => at.id === id);
      if (index === -1) throw new Error('Asset type not found');
      mockAssetTypes.splice(index, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTypes'] });
    },
  });
};
