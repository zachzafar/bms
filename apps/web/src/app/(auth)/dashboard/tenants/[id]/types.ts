export interface Tenant {
  id: string;
  name: string;
  subdomain?: string | null;
  createdAt: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
  createdAt: string | Date | null;
  roles?: number[];
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];
  userCount: number;
  isSystem?: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsed?: string | null;
}

export interface TenantDetails {
  tenant: Tenant;
  userCount: number;
  roleCount: number;
  apiKeyCount: number;
}

export const AVAILABLE_PERMISSIONS = [
  'users:read',
  'users:write',
  'users:delete',
  'roles:read',
  'roles:write',
  'roles:delete',
  'api-keys:read',
  'api-keys:write',
  'api-keys:delete',
  'billing:read',
  'billing:write',
  'settings:read',
  'settings:write',
  'analytics:read',
  'reports:read',
  'reports:write'
];

export const AVAILABLE_SCOPES = [
  'users:read',
  'users:write',
  'billing:read',
  'billing:write',
  'analytics:read',
  'reports:read',
  'settings:read'
];