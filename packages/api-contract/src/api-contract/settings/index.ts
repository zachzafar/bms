import { initContract } from '@ts-rest/core';
import { formsContract } from './forms';
import { assetTypeContract } from './assetType';


const c = initContract();

export const settingsContract = c.router({
    form: formsContract,
    assetType: assetTypeContract,
})

export * from './forms';
export * from './assetType';
