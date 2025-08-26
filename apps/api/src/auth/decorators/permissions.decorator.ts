import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { PermissionsGuard, PERMISSIONS_KEY } from '../guards/permissions/permissions.guard';

/**
 * Decorator to require specific permissions for a controller or method
 * @param permissions Array of required permissions
 * @param requireAll If true, user must have ALL permissions, if false, user must have ANY permission
 */
export const RequirePermissionsDecorator = (permissions: string[], requireAll: boolean = false) => {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, { permissions, requireAll }),
    UseGuards(PermissionsGuard)
  );
};

/**
 * Decorator to require read permission for a specific resource
 * @param resource The resource type (e.g., 'assets', 'users', 'bookings')
 */
export const RequireRead = (resource: string) => {
  const permission = `${resource}:read`;
  return RequirePermissionsDecorator([permission]);
};

/**
 * Decorator to require write permission for a specific resource
 * @param resource The resource type (e.g., 'assets', 'users', 'bookings')
 */
export const RequireWrite = (resource: string) => {
  const permission = `${resource}:write`;
  return RequirePermissionsDecorator([permission]);
};

/**
 * Decorator to require delete permission for a specific resource
 * @param resource The resource type (e.g., 'assets', 'users', 'bookings')
 */
export const RequireDelete = (resource: string) => {
  const permission = `${resource}:delete`;
  return RequirePermissionsDecorator([permission]);
};

/**
 * Decorator to require asset management permissions
 */
export const RequireAssetPermissions = () => {
  return RequirePermissionsDecorator([
    'assets:read',
    'assets:write',
    'assets:delete',
  ]);
};

/**
 * Decorator to require user management permissions
 */
export const RequireUserPermissions = () => {
  return RequirePermissionsDecorator([
    'users:read',
    'users:write',
  ]);
};

/**
 * Decorator to require booking management permissions
 */
export const RequireBookingPermissions = () => {
  return RequirePermissionsDecorator([
    'bookings:read',
    'bookings:write',
    'bookings:delete',
  ]);
};

/**
 * Decorator to require CRM permissions
 */
export const RequireCrmPermissions = () => {
  return RequirePermissionsDecorator([
    'crm:read',
    'crm:write',
    'crm:delete',
  ]);
};

/**
 * Decorator to require billing permissions
 */
export const RequireBillingPermissions = () => {
  return RequirePermissionsDecorator([
    'billing:read',
    'billing:write',
    'billing:delete',
  ]);
};

/**
 * Decorator to require analytics permissions
 */
export const RequireAnalyticsPermissions = () => {
  return RequirePermissionsDecorator([
    'analytics:read',
    'analytics:write',
  ]);
};

/**
 * Decorator to require system admin permissions
 */
export const RequireSystemAdmin = () => {
  return RequirePermissionsDecorator(['system:admin']);
};

/**
 * Decorator to require tenant admin permissions
 */
export const RequireTenantAdmin = () => {
  return RequirePermissionsDecorator([
    'tenants:read',
    'tenants:write',
    'users:read',
    'users:write',
  ]);
};

/**
 * Decorator to require any permission from a list
 * @param permissions Array of permissions, user needs ANY of them
 */
export const RequireAnyPermission = (permissions: string[]) => {
  return RequirePermissionsDecorator(permissions, false);
};

/**
 * Decorator to require all permissions from a list
 * @param permissions Array of permissions, user needs ALL of them
 */
export const RequireAllPermissions = (permissions: string[]) => {
  return RequirePermissionsDecorator(permissions, true);
};
