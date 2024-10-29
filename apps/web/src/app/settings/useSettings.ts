import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';
import { z } from 'zod';
import { insertAssetPropertySchema, patchAssetPropertySchema, selectAssetPropertySchema } from '@/server/db/schema/settings';

type AssetProperty = z.infer<typeof selectAssetPropertySchema>;
type InsertAssetProperty = z.infer<typeof insertAssetPropertySchema>;
type PatchAssetProperty = z.infer<typeof patchAssetPropertySchema>;

// Fetch all properties
export const useProperties = () => {
  return useQuery<AssetProperty[], Error>({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await client.property.$get();
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      return data.map((property: any) => ({
        ...property,
        createdAt: new Date(property.createdAt),
      }));
    },
  });
};

// Add a new property
export const useAddProperty = () => {
  const queryClient = useQueryClient();
  return useMutation<AssetProperty, Error, InsertAssetProperty>({
    mutationFn: async (newProperty) => {
      const response = await client.property.$post({ json: newProperty });
      if (!response.ok) {
        throw new Error('Failed to add property');
      }
      const data = await response.json();
      return { ...data, createdAt: new Date(data.createdAt) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

// Update an existing property
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  return useMutation<AssetProperty, Error, { id: number; data: PatchAssetProperty }>({
    mutationFn: async ({ id, data }) => {
      const response = await client.property[':id'].$patch({
        param: { id: id.toString() },
        json: data,
      });
      if (!response.ok) {
        throw new Error('Failed to update property');
      }
      const responseData = await response.json();
      return { ...responseData, createdAt: new Date(responseData.createdAt) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

// Delete a property
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const response = await client.property[':id'].$delete({
        param: { id: id.toString() },
      });
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};