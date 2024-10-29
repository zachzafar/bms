'use server'

import prisma from "./prisma";


export async function getAssetTypes() {

}

export async function getAssetTypesWithProperties(assetTypeId?: number) {
    if (assetTypeId) {
        const assetType = await prisma.assetType.findUnique({
            where: { id: assetTypeId }, include: {
                AssetTypeHasProperties: {
                    include: {
                        assetProperty: true
                    }
                }
            }
        })

        return assetType
    }
    const assetTypes = await prisma.assetType.findMany({
        include: {
            AssetTypeHasProperties: {
                include: {
                    assetProperty: true
                }
            }
        }
    })

    return assetTypes
}


export async function getPropertyTypesForAssetType(assetTypeId: number) {
    const propertyTypes = await prisma.assetTypeHasProperties.findMany({ where: { assetTypeId } })
    return propertyTypes
}

export async function getProperties() {
    const properties = await prisma.assetProperty.findMany()
    return properties
}

export async function getAssets() {
    const assets = await prisma.asset.findMany()
    return assets
}

export async function getOwners() {
    const owners = await prisma.owner.findMany({ take: 10 })
    return owners
}

export async function getGroupTypes() {
    const groupTypes = await prisma.groupType.findMany({ take: 10 })
    return groupTypes
}

export async function getGroups(groupTypeId: number) {
    const groups = await prisma.group.findMany({ where: { id: groupTypeId } })
    return groups
}

// export async function getAssetCategories(assetTypeId: string) {
//     const assetSubTypes = await prisma.assetSubGroup.findMany({ where: { id: assetTypeId } })
//     return assetSubTypes
// }

