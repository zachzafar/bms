export enum PermissionScope {
    ASSETS_READ = "assets:read",
    ASSETS_WRITE = "assets:write",
    ASSETS_DELETE = "assets:delete",
    
    // User permissions
    USERS_READ = "users:read",
    USERS_WRITE = "users:write",
    
    // Other resource permissions
    REPORTS_READ = "reports:read",
    SETTINGS_READ = "settings:read",
    SETTINGS_WRITE = "settings:write",
    
}

export function getAllScopes(): string[] {
    return Object.values(PermissionScope);
  }
  
  // Helper to get scopes by category
  export function getAssetScopes(): string[] {
    return [
      PermissionScope.ASSETS_READ,
      PermissionScope.ASSETS_WRITE,
      PermissionScope.ASSETS_DELETE,
    ];
  }