import { initContract } from '@ts-rest/core';
import { formsContract } from './forms';




const c = initContract();

export const settingsContract = c.router({
    form: formsContract
})