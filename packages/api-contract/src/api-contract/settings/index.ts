import { initContract } from '@ts-rest/core';
import { formsContract } from './forms';
import { assetTypeContract } from './assetType';
import { propertiesContract } from './properties';
import { tagsContract } from './tags';


const c = initContract();

export const settingsContract = c.router({
    form: formsContract,
    assetType: assetTypeContract,
    properties: propertiesContract,
    tags: tagsContract
})

export * from './forms';
export * from './assetType';
export * from './properties';
export * from './tags'

