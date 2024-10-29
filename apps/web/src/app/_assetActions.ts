import prisma from "@/lib/prisma";
import { AssetSchemaInputs } from "@/lib/schemas";


export async function addAsset(data: AssetSchemaInputs) {
    try {
        // const asset = await prisma.asset.create({
        //     data : {

        //     }

        // })
        // return { success: true, data: asset }
    } catch (err) {
        console.error('Error creating new asset:', err);


        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };
    }
}

export async function updateAsset(id: number, data: AssetSchemaInputs, assetTypeData: any, assetSubTypeData: any) {
    try {
        // const asset = await prisma.asset.update({
        //     where: { id },
        // })
        // return { success: true, data: asset }


    } catch (err) {
        console.error('Error updating asset:', err);

        // Customize the error message based on the type of error
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

        return { success: false, error: errorMessage };
    }
}