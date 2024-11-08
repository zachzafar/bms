import { initContract } from '@ts-rest/core';
import { insertAssetPropertySchema, selectAssetPropertySchema } from './src/settings';
import { tenantsContract } from './src/tenants';

const c = initContract();

export const contract = c.router({
  tenants: tenantsContract
});