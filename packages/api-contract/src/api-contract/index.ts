import { initContract } from '@ts-rest/core';
import { authContract } from './auth';
import { assetsContract } from './assets';
import { settingsContract } from './settings';
import { bookingContract } from './booking';
import { maintenanceContract } from './maintenance';
import { userContract } from './users';
import { customerContract } from './customers';
import { ownerContract } from './owners';
import { teamsContract } from './teams';
import { tenantsContract } from './tenants';
import { keysContract } from './keys';
import { analyticsContract } from './analytics';
import { rateContract } from './rates';
import { billingContract } from './billing';
import { systemAdminContract } from './system-admin';
import { reportsContract } from './reports';
import { blockedDatesContract } from './blocked-dates';
import { addonsContract } from './addons';
import { taxesFeesContract } from './taxes-fees';

const c = initContract();


export const contract = c.router({
  auth: authContract,
  assets: assetsContract,
  settings: settingsContract,
  booking: bookingContract,
  maintenance: maintenanceContract,
  users: userContract,
  customers: customerContract,
  owners: ownerContract,
  teams: teamsContract,
  tenants: tenantsContract,
  keys: keysContract,
  analytics: analyticsContract,
  blockedDates: blockedDatesContract,
  rates: rateContract,
  billing: billingContract,
  systemAdmin: systemAdminContract,
  reports: reportsContract,
  addons: addonsContract,
  taxesFees: taxesFeesContract,
});

export * from './auth';
export * from './assets';
export * from './settings';
export * from './booking';
export * from './blocked-dates';
export * from './maintenance';
export * from './users';
export * from './customers';
export * from './owners';
export * from './teams';
export * from './tenants';
export * from './keys';
export * from './analytics';
export * from './rates';
export * from './billing';
export * from './system-admin';
export * from './reports';
export * from './addons';
export * from './taxes-fees';
