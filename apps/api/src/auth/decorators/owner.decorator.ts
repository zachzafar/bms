import { SetMetadata } from '@nestjs/common';

export const OWNER_KEY = 'owner';
export const RequireOwner = () => SetMetadata(OWNER_KEY, true);
