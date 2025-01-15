import { initContract } from '@ts-rest/core';
import { formsContract } from './forms';
import { assetTypeContract } from './assetType';
import { group } from 'console';
import { groupsContract } from './groups';




const c = initContract();

export const settingsContract = c.router({
    form: formsContract,
    assetType: assetTypeContract,
    group: groupsContract
})