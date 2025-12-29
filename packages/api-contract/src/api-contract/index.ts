import { initContract } from '@ts-rest/core';
import { authContract} from './auth';
import { assetsContract } from './assets';
import { settingsContract } from './settings';
import { bookingContract } from './booking';
import { maintenanceContract } from './maintenance';
import { userContract } from './users';
import { teamsContract } from './teams';
import { tenantsContract } from './tenants';
import { keysContract } from './keys';
import { analyticsContract } from './analytics';
import { slotContract } from './slots';
import { rateContract } from './rates';
import { billingContract } from './billing';
import { crmContract } from './crm';
import { systemAdminContract } from './system-admin';
import { reportsContract } from './reports';


const c = initContract();


export const contract = c.router({
  auth: authContract,
  assets: assetsContract,
  settings: settingsContract,
  booking: bookingContract,
  maintenance: maintenanceContract,
  users: userContract,
  teams: teamsContract,
  tenants: tenantsContract,
  keys: keysContract,
  analytics: analyticsContract,
  slots: slotContract,
  rates: rateContract,
  billing: billingContract,
  crm: crmContract,
  systemAdmin: systemAdminContract,
  reports: reportsContract,
});

export * from './auth';
export * from './assets';
export * from './settings';
export * from './booking';
export * from './maintenance';
export * from './users';
export * from './teams';
export * from './tenants';
export * from './keys';
export * from './analytics';
export * from './rates';
export * from './billing';
export * from './crm';
export * from './system-admin';
export * from './reports';
export * from './zod'
