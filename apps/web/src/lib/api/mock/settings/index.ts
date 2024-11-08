import { delay } from '..';
import { mockProperties } from './data';
import { AssetProperty, InsertAssetProperty, PatchAssetProperty } from '@repo/drizzle/src/schema';



export const mockPropertiesService = {
    getProperties: async (): Promise<AssetProperty[]> => {
        await delay(500); // Simulate network delay
        return [...mockProperties];
      },
    
      addProperty: async (newProperty: InsertAssetProperty): Promise<AssetProperty> => {
        await delay(500);
        const property: AssetProperty = {
          ...newProperty,
          id: Math.max(...mockProperties.map(p => p.id)) + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId: newProperty.tenantId ?? null,
        };
        mockProperties.push(property);
        return property;
      },
    
      updateProperty: async ( data: PatchAssetProperty): Promise<AssetProperty> => {
        await delay(500);
        const index = mockProperties.findIndex(p => p.id === data.id);
        if (index === -1) throw new Error('Property not found');
        const updatedProperty = { ...mockProperties[index], ...data, updatedAt: new Date() };
        mockProperties[index] = updatedProperty;
        return updatedProperty;
      },
    
      deleteProperty: async (id: number): Promise<void> => {
        await delay(500);
        const index = mockProperties.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Property not found');
        mockProperties.splice(index, 1);
      },
}

export const mockAssetTypesService = {
    
}