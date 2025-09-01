import { SetMetadata } from '@nestjs/common';

export const IS_AMDIN_ROUTE= 'IS_ADMIN';
export const IsAdminRoute = () => SetMetadata(IS_AMDIN_ROUTE, true);
