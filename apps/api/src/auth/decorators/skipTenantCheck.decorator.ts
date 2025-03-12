import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_CHECK_KEY = 'IS_PUBLIC';
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);