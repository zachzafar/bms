import { initContract } from '@ts-rest/core';
import { tenantsContract } from './tenants';

const c = initContract();

export * from './tenants';
export * from './users';
export * from './auth'
export * from './settings'

export const contract = c.router({
  tenants: tenantsContract
});