import { initContract } from '@ts-rest/core';
import { authContract} from './auth';
import { assetsContract } from './assets';
import { settingsContract } from './settings';
import { bookingContract } from './booking';
import { maintenanceContract } from './maintenance';


const c = initContract();


export const contract = c.router({
  auth: authContract,
  assets: assetsContract,
  settings: settingsContract,
  booking: bookingContract,
  maintenance: maintenanceContract,
});

export * from './auth';
export * from './assets';
export * from './settings';
export * from './booking';
export * from './maintenance';
