import { AssetProperty, AssetType, AssetTypeWithProperties } from "@repo/api-contract";


export const mockProperties: AssetProperty[] = [
    {
        id: 1,
        name: 'Size',
        propertyType: 'number',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        tenantId: undefined
    },
    {
        id: 2,
        name: 'Color',
        propertyType: 'string',
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        tenantId: undefined
    },
    {
        id: 3,
        name: 'Is Available',
        propertyType: 'boolean',
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
        tenantId: undefined
    }
  ];


  export let mockAssetTypes: AssetTypeWithProperties[] = [
    {
        id: 1, name: 'Vehicle', schema: [{ propertyId: 1, isRequired: true }, { propertyId: 2, isRequired: false }],
        tenantId: '',
        createdAt: new Date(),
        updatedAt: null,
        description: null,
        bookingFormId: undefined
    },
    {
        id: 2, name: 'Building', schema: [{ propertyId: 3, isRequired: true }, { propertyId: 4, isRequired: true }],
        tenantId: '',
        createdAt: new Date(),
        updatedAt: null,
        description: null,
        bookingFormId: undefined
    },
  ];