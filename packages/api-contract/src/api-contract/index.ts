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
});

export * from './auth';
export * from './assets';
export * from './settings';
export * from './booking';
export * from './maintenance';
export * from './users';
export * from './teams';
export * from './tenants';
export * from './keys'
