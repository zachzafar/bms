export enum PermissionScope {
  // Asset Management
  ASSETS_READ = "assets:read",
  ASSETS_WRITE = "assets:write",
  ASSETS_DELETE = "assets:delete",
  ASSETS_PROPERTIES_MANAGE = "assets:properties:manage",
  ASSET_CONFIG_READ = 'assets:config:read',
  ASSET_CONFIG_WRITE = 'assets:config:write',
  ASSET_CONFIG_UPDATE = 'assets:config:update',
  ASSET_CONFIG_DELETE = 'assets:config:delete',
  
  // User Management
  USERS_READ = "users:read",
  USERS_WRITE = "users:write",
  USERS_DELETE = "users:delete",
  USERS_ROLES_MANAGE = "users:roles:manage",
  CUSTOMERS_READ = "customers:read",
  OWNERS_READ = "owners:read",
  
  // Booking Management
  BOOKINGS_READ = "bookings:read",
  BOOKINGS_WRITE = "bookings:write",
  BOOKINGS_DELETE = "bookings:delete",
  BOOKINGS_CANCEL = "bookings:cancel",
  BOOKINGS_BY_TAG_CREATE = "bookings:by-tag:create",
  
  // Maintenance Management
  MAINTENANCE_READ = "maintenance:read",
  MAINTENANCE_WRITE = "maintenance:write",
  MAINTENANCE_DELETE = "maintenance:delete",
  MAINTENANCE_FILES_MANAGE = "maintenance:files:manage",
  
  // Team Management
  TEAMS_READ = "teams:read",
  TEAMS_WRITE = "teams:write",
  TEAMS_DELETE = "teams:delete",
  TEAMS_USERS_MANAGE = "teams:users:manage",
  TEAMS_ASSETS_MANAGE = "teams:assets:manage",
  
  // Tenant Management
  TENANTS_READ = "tenants:read",
  TENANTS_WRITE = "tenants:write",
  TENANTS_DELETE = "tenants:delete",
  
  // Key Management
  KEYS_READ = "keys:read",
  KEYS_WRITE = "keys:write",
  KEYS_DELETE = "keys:delete",
  
  // Analytics
  ANALYTICS_READ = "analytics:read",
  ANALYTICS_WRITE = "analytics:write",
  ANALYTICS_ASSETS_READ = "analytics:assets:read",
  ANALYTICS_BOOKINGS_READ = "analytics:bookings:read",
  ANALYTICS_CUSTOMERS_READ = "analytics:customers:read",
  ANALYTICS_FINANCIAL_READ = "analytics:financial:read",
  
  // Slot Management
  SLOTS_READ = "slots:read",
  SLOTS_WRITE = "slots:write",
  SLOTS_DELETE = "slots:delete",
  
  // Rate Management
  RATES_READ = "rates:read",
  RATES_WRITE = "rates:write",
  RATES_DELETE = "rates:delete",
  
  // Billing & Financial
  BILLING_READ = "billing:read",
  BILLING_WRITE = "billing:write",
  BILLING_DELETE = "billing:delete",
  INVOICES_READ = "invoices:read",
  INVOICES_WRITE = "invoices:write",
  INVOICES_DELETE = "invoices:delete",
  PAYMENTS_READ = "payments:read",
  PAYMENTS_WRITE = "payments:write",
  PAYMENTS_DELETE = "payments:delete",
  
  // CRM Operations
  CRM_READ = "crm:read",
  CRM_WRITE = "crm:write",
  CRM_DELETE = "crm:delete",
  
  // Contact Management
  CONTACTS_READ = "contacts:read",
  CONTACTS_WRITE = "contacts:write",
  CONTACTS_DELETE = "contacts:delete",
  
  // Inquiry Management
  INQUIRIES_READ = "inquiries:read",
  INQUIRIES_WRITE = "inquiries:write",
  INQUIRIES_DELETE = "inquiries:delete",
  INQUIRIES_ASSIGN = "inquiries:assign",
  
  // Communication Management
  COMMUNICATIONS_READ = "communications:read",
  COMMUNICATIONS_WRITE = "communications:write",
  COMMUNICATIONS_DELETE = "communications:delete",
  
  // Feedback Management
  FEEDBACK_READ = "feedback:read",
  FEEDBACK_WRITE = "feedback:write",
  FEEDBACK_DELETE = "feedback:delete",
  
  // Task Management
  TASKS_READ = "tasks:read",
  TASKS_WRITE = "tasks:write",
  TASKS_DELETE = "tasks:delete",
  TASKS_ASSIGN = "tasks:assign",
  
  // Document Management
  DOCUMENTS_READ = "documents:read",
  DOCUMENTS_WRITE = "documents:write",
  DOCUMENTS_DELETE = "documents:delete",
  
  // Brochure Management
  BROCHURES_READ = "brochures:read",
  BROCHURES_WRITE = "brochures:write",
  BROCHURES_DELETE = "brochures:delete",
  
  // Tags Management
  TAGS_READ = "tags:read",
  TAGS_WRITE = "tags:write",
  TAGS_DELETE = "tags:delete",
  
  // Object Storage
  OBJECT_STORAGE_READ = "object-storage:read",
  OBJECT_STORAGE_WRITE = "object-storage:write",
  OBJECT_STORAGE_DELETE = "object-storage:delete",
  
  // Email Management
  EMAIL_READ = "email:read",
  EMAIL_WRITE = "email:write",
  EMAIL_SEND = "email:send",
  
  // Schema Design
  SCHEMA_DESIGN_READ = "schema-design:read",
  SCHEMA_DESIGN_WRITE = "schema-design:write",
  SCHEMA_DESIGN_DELETE = "schema-design:delete",
  
  // System Administration
  SYSTEM_ADMIN = "system:admin",
  SYSTEM_CONFIG_READ = "system:config:read",
  SYSTEM_CONFIG_WRITE = "system:config:write",
  
  // Reports
  REPORTS_READ = "reports:read",
  REPORTS_GENERATE = "reports:generate",
  
  // Settings
  SETTINGS_READ = "settings:read",
  SETTINGS_WRITE = "settings:write",
}

export function getAllScopes(): string[] {
  return Object.values(PermissionScope);
}

// Helper functions to get scopes by category
export function getAssetScopes(): string[] {
  return [
    PermissionScope.ASSETS_READ,
    PermissionScope.ASSETS_WRITE,
    PermissionScope.ASSETS_DELETE,
    PermissionScope.ASSETS_PROPERTIES_MANAGE,
  ];
}

export function getUserScopes(): string[] {
  return [
    PermissionScope.USERS_READ,
    PermissionScope.USERS_WRITE,
    PermissionScope.USERS_DELETE,
    PermissionScope.USERS_ROLES_MANAGE,
    PermissionScope.CUSTOMERS_READ,
    PermissionScope.OWNERS_READ,
  ];
}

export function getBookingScopes(): string[] {
  return [
    PermissionScope.BOOKINGS_READ,
    PermissionScope.BOOKINGS_WRITE,
    PermissionScope.BOOKINGS_DELETE,
    PermissionScope.BOOKINGS_CANCEL,
    PermissionScope.BOOKINGS_BY_TAG_CREATE,
  ];
}

export function getMaintenanceScopes(): string[] {
  return [
    PermissionScope.MAINTENANCE_READ,
    PermissionScope.MAINTENANCE_WRITE,
    PermissionScope.MAINTENANCE_DELETE,
    PermissionScope.MAINTENANCE_FILES_MANAGE,
  ];
}

export function getTeamScopes(): string[] {
  return [
    PermissionScope.TEAMS_READ,
    PermissionScope.TEAMS_WRITE,
    PermissionScope.TEAMS_DELETE,
    PermissionScope.TEAMS_USERS_MANAGE,
    PermissionScope.TEAMS_ASSETS_MANAGE,
  ];
}

export function getCrmScopes(): string[] {
  return [
    PermissionScope.CRM_READ,
    PermissionScope.CRM_WRITE,
    PermissionScope.CRM_DELETE,
    PermissionScope.CONTACTS_READ,
    PermissionScope.CONTACTS_WRITE,
    PermissionScope.CONTACTS_DELETE,
    PermissionScope.INQUIRIES_READ,
    PermissionScope.INQUIRIES_WRITE,
    PermissionScope.INQUIRIES_DELETE,
    PermissionScope.INQUIRIES_ASSIGN,
    PermissionScope.COMMUNICATIONS_READ,
    PermissionScope.COMMUNICATIONS_WRITE,
    PermissionScope.COMMUNICATIONS_DELETE,
    PermissionScope.FEEDBACK_READ,
    PermissionScope.FEEDBACK_WRITE,
    PermissionScope.FEEDBACK_DELETE,
    PermissionScope.TASKS_READ,
    PermissionScope.TASKS_WRITE,
    PermissionScope.TASKS_DELETE,
    PermissionScope.TASKS_ASSIGN,
    PermissionScope.DOCUMENTS_READ,
    PermissionScope.DOCUMENTS_WRITE,
    PermissionScope.DOCUMENTS_DELETE,
    PermissionScope.BROCHURES_READ,
    PermissionScope.BROCHURES_WRITE,
    PermissionScope.BROCHURES_DELETE,
  ];
}

export function getBillingScopes(): string[] {
  return [
    PermissionScope.BILLING_READ,
    PermissionScope.BILLING_WRITE,
    PermissionScope.BILLING_DELETE,
    PermissionScope.INVOICES_READ,
    PermissionScope.INVOICES_WRITE,
    PermissionScope.INVOICES_DELETE,
    PermissionScope.PAYMENTS_READ,
    PermissionScope.PAYMENTS_WRITE,
    PermissionScope.PAYMENTS_DELETE,
  ];
}

export function getAnalyticsScopes(): string[] {
  return [
    PermissionScope.ANALYTICS_READ,
    PermissionScope.ANALYTICS_WRITE,
    PermissionScope.ANALYTICS_ASSETS_READ,
    PermissionScope.ANALYTICS_BOOKINGS_READ,
    PermissionScope.ANALYTICS_CUSTOMERS_READ,
    PermissionScope.ANALYTICS_FINANCIAL_READ,
  ];
}

export function getSystemAdminScopes(): string[] {
  return [
    PermissionScope.SYSTEM_ADMIN,
    PermissionScope.SYSTEM_CONFIG_READ,
    PermissionScope.SYSTEM_CONFIG_WRITE,
    PermissionScope.TENANTS_READ,
    PermissionScope.TENANTS_WRITE,
    PermissionScope.TENANTS_DELETE,
    PermissionScope.KEYS_READ,
    PermissionScope.KEYS_WRITE,
    PermissionScope.KEYS_DELETE,
  ];
}

export function getReadOnlyScopes(): string[] {
  return [
    PermissionScope.ASSETS_READ,
    PermissionScope.USERS_READ,
    PermissionScope.CUSTOMERS_READ,
    PermissionScope.OWNERS_READ,
    PermissionScope.BOOKINGS_READ,
    PermissionScope.MAINTENANCE_READ,
    PermissionScope.TEAMS_READ,
    PermissionScope.TENANTS_READ,
    PermissionScope.ANALYTICS_READ,
    PermissionScope.ANALYTICS_ASSETS_READ,
    PermissionScope.ANALYTICS_BOOKINGS_READ,
    PermissionScope.ANALYTICS_CUSTOMERS_READ,
    PermissionScope.ANALYTICS_FINANCIAL_READ,
    PermissionScope.SLOTS_READ,
    PermissionScope.RATES_READ,
    PermissionScope.BILLING_READ,
    PermissionScope.INVOICES_READ,
    PermissionScope.PAYMENTS_READ,
    PermissionScope.CRM_READ,
    PermissionScope.CONTACTS_READ,
    PermissionScope.INQUIRIES_READ,
    PermissionScope.COMMUNICATIONS_READ,
    PermissionScope.FEEDBACK_READ,
    PermissionScope.TASKS_READ,
    PermissionScope.DOCUMENTS_READ,
    PermissionScope.BROCHURES_READ,
    PermissionScope.TAGS_READ,
    PermissionScope.OBJECT_STORAGE_READ,
    PermissionScope.EMAIL_READ,
    PermissionScope.SCHEMA_DESIGN_READ,
    PermissionScope.SYSTEM_CONFIG_READ,
    PermissionScope.REPORTS_READ,
    PermissionScope.SETTINGS_READ,
  ];
}

export function getWriteScopes(): string[] {
  return [
    PermissionScope.ASSETS_WRITE,
    PermissionScope.ASSETS_PROPERTIES_MANAGE,
    PermissionScope.USERS_WRITE,
    PermissionScope.USERS_ROLES_MANAGE,
    PermissionScope.BOOKINGS_WRITE,
    PermissionScope.BOOKINGS_BY_TAG_CREATE,
    PermissionScope.MAINTENANCE_WRITE,
    PermissionScope.MAINTENANCE_FILES_MANAGE,
    PermissionScope.TEAMS_WRITE,
    PermissionScope.TEAMS_USERS_MANAGE,
    PermissionScope.TEAMS_ASSETS_MANAGE,
    PermissionScope.SLOTS_WRITE,
    PermissionScope.RATES_WRITE,
    PermissionScope.BILLING_WRITE,
    PermissionScope.INVOICES_WRITE,
    PermissionScope.PAYMENTS_WRITE,
    PermissionScope.CRM_WRITE,
    PermissionScope.CONTACTS_WRITE,
    PermissionScope.INQUIRIES_WRITE,
    PermissionScope.INQUIRIES_ASSIGN,
    PermissionScope.COMMUNICATIONS_WRITE,
    PermissionScope.FEEDBACK_WRITE,
    PermissionScope.TASKS_WRITE,
    PermissionScope.TASKS_ASSIGN,
    PermissionScope.DOCUMENTS_WRITE,
    PermissionScope.BROCHURES_WRITE,
    PermissionScope.TAGS_WRITE,
    PermissionScope.OBJECT_STORAGE_WRITE,
    PermissionScope.EMAIL_WRITE,
    PermissionScope.EMAIL_SEND,
    PermissionScope.SCHEMA_DESIGN_WRITE,
    PermissionScope.SYSTEM_CONFIG_WRITE,
    PermissionScope.REPORTS_GENERATE,
    PermissionScope.SETTINGS_WRITE,
  ];
}

export function getDeleteScopes(): string[] {
  return [
    PermissionScope.ASSETS_DELETE,
    PermissionScope.USERS_DELETE,
    PermissionScope.BOOKINGS_DELETE,
    PermissionScope.BOOKINGS_CANCEL,
    PermissionScope.MAINTENANCE_DELETE,
    PermissionScope.TEAMS_DELETE,
    PermissionScope.TENANTS_DELETE,
    PermissionScope.KEYS_DELETE,
    PermissionScope.SLOTS_DELETE,
    PermissionScope.RATES_DELETE,
    PermissionScope.BILLING_DELETE,
    PermissionScope.INVOICES_DELETE,
    PermissionScope.PAYMENTS_DELETE,
    PermissionScope.CRM_DELETE,
    PermissionScope.CONTACTS_DELETE,
    PermissionScope.INQUIRIES_DELETE,
    PermissionScope.COMMUNICATIONS_DELETE,
    PermissionScope.FEEDBACK_DELETE,
    PermissionScope.TASKS_DELETE,
    PermissionScope.DOCUMENTS_DELETE,
    PermissionScope.BROCHURES_DELETE,
    PermissionScope.TAGS_DELETE,
    PermissionScope.OBJECT_STORAGE_DELETE,
    PermissionScope.SCHEMA_DESIGN_DELETE,
  ];
}