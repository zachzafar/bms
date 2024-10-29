'use server'

import { getAssetTypesWithProperties, getPropertyTypesForAssetType } from "@/lib/db";
import prisma from "@/lib/prisma";
import { AssetTypeSchemaInputs, AsseTypeSchemaInputsAndId, PropertyInputs } from "@/lib/schemas";
import { AssetTypeWithProperties } from "@/types";



export async function addProperty(data: PropertyInputs) {
    try {
        const property = await prisma.assetProperty.create({
            data: {
                name: data.name,
                propertyType: data.type
            }
        })

        return { success: true, data: property }
    } catch (err) {
        console.error('Error adding property:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };
    }
}

export async function updateProperty(id: number, data: PropertyInputs) {
    try {
        const property = await prisma.assetProperty.update({
            where: { id }, data: { name: data.name, propertyType: data.type }
        })

        return { success: true, data: property }
    } catch (err) {
        console.error('Error updating property:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };

    }
}

export async function deleteProperty(id: number) {
    try {
        const deletedProperty = await prisma.assetProperty.delete({
            where: {
                id
            }
        })
        return { success: true, data: deletedProperty }
    } catch (err) {
        console.error('Error deleting asset type:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };

    }
}

export async function addAssetTypeWithProperties(data: AssetTypeSchemaInputs) {
    try {
        const assetType = await prisma.assetType.create({
            data: {
                name: data.name,
            }
        })

        const assetTypePropertyPromises = data.schema.map(property => prisma.assetTypeHasProperties.create({ data: { required: property.isRequired, assetPropertyId: property.propertyId, assetTypeId: assetType.id } }))

        await Promise.all(assetTypePropertyPromises)

        const assetTypeWithProperties = await getAssetTypesWithProperties(assetType.id) as AssetTypeWithProperties

        if (assetTypeWithProperties) {
            return { success: true, data: assetTypeWithProperties }
        } else {
            throw new Error('some error occured while retrieving Asset Type with corresponding properties')
        }


    } catch (err) {
        console.error('Error adding asset type:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };
    }
}

export async function updateAssetType(id: number, data: AssetTypeSchemaInputs) {
    try {
        const assetType = await prisma.assetType.update({
            where: { id }, data: { name: data.name, }
        })

        const existingProperties = await getPropertyTypesForAssetType(id)

        const existingPropertyIds = existingProperties.map((property) => property.id)

        const newProperties = data.schema.filter((property) => !existingPropertyIds.includes(property.propertyId))

        const updatedProperties = data.schema.filter((property) => existingPropertyIds.includes(property.propertyId))

        const deletedProperties = existingProperties.filter((property) => !data.schema.some((newProperty) => newProperty.propertyId === property.assetPropertyId))

        const updatePromises = updatedProperties.map((property) => prisma.assetTypeHasProperties.update({
            where: {
                assetTypeId_assetPropertyId: {
                    assetTypeId: id,
                    assetPropertyId: property.propertyId,
                },
            },
            data: {
                required: property.isRequired
            }
        }))

        const addPromises = updatedProperties.map((property) => prisma.assetTypeHasProperties.create({
            data: {
                assetTypeId: id,
                assetPropertyId: property.propertyId,
                required: property.isRequired,
            },
        }))

        const deletedPromises = deletedProperties.map((property) =>
            prisma.assetTypeHasProperties.delete({
                where: {
                    id: property.id,
                },
            })
        );


        await Promise.all([...updatePromises, ...addPromises, ...deletedPromises])

        const assetTypeWithProperties = await getAssetTypesWithProperties(id) as AssetTypeWithProperties

        return { success: true, data: assetTypeWithProperties }
    } catch (err) {
        console.error('Error updating asset type:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };

    }
}

export async function deleteAssetType(id: number) {
    try {
        const deletedAssetType = await prisma.assetType.delete({
            where: {
                id
            }
        })
        return { success: true, data: deletedAssetType }
    } catch (err) {
        console.error('Error deleting asset type:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };

    }
}