# Authorization System for AMS API

This document explains how to use the comprehensive authorization system built with NestJS best practices.

## 🏗️ **Architecture Overview**

The authorization system follows a **multi-layered approach**:

1. **Authentication** → JWT/API Key validation (UniversalGuard)
2. **Tenant Isolation** → Tenant access validation (TenantGuard)  
3. **Authorization** → Permission-based access control (PermissionsGuard)

```
Request → UniversalGuard → TenantGuard → PermissionsGuard → Controller
```

## 🔐 **How It Works**

### **1. Authentication Flow**
- `UniversalGuard` validates JWT tokens or API keys
- User information is attached to `request.user`
- Token contains: `{ sub, tenants, roles }`

### **2. Tenant Validation**
- `TenantGuard` ensures user has access to the requested tenant
- Validates `x-tenant-id` header against user's tenant list
- Prevents cross-tenant access

### **3. Permission Checking**
- `PermissionsGuard` validates user permissions for the specific tenant
- Checks if user has required permissions through their roles
- Supports both "ANY" and "ALL" permission requirements

## 🎯 **Token Structure**

Your JWT tokens now contain:

```typescript
{
  sub: "user_id",
  tenants: ["tenant1", "tenant2"],
  roles: {
    "tenant1": [
      {
        roleId: "1",
        roleName: "Asset Manager",
        permissions: ["assets:read", "assets:write", "assets:delete"]
      }
    ],
    "tenant2": [
      {
        roleId: "3", 
        roleName: "Viewer",
        permissions: ["assets:read", "users:read"]
      }
    ]
  }
}
```

## 🚀 **Usage Examples**

### **Basic Permission Decorators**

```typescript
import { RequireRead, RequireWrite, RequireDelete } from 'src/auth/decorators/permissions.decorator';

@Controller('assets')
export class AssetsController {
  @Get()
  @RequireRead('assets')
  async getAssets() {
    // Only users with assets:read permission can access
  }

  @Post()
  @RequireWrite('assets')
  async createAsset() {
    // Only users with assets:write permission can access
  }

  @Delete(':id')
  @RequireDelete('assets')
  async deleteAsset() {
    // Only users with assets:delete permission can access
  }
}
```

### **Specific Permission Requirements**

```typescript
import { RequirePermissionsDecorator } from 'src/auth/decorators/permissions.decorator';

@Controller('assets')
export class AssetsController {
  @Post(':id/properties')
  @RequirePermissionsDecorator(['assets:properties:manage'])
  async addAssetProperties() {
    // Only users with assets:properties:manage permission can access
  }
}
```

### **Multiple Permission Requirements**

```typescript
@Controller('bookings')
export class BookingsController {
  @Post('by-tag')
  @RequirePermissionsDecorator([
    'bookings:write',
    'bookings:by-tag:create'
  ], true) // requireAll = true means user must have ALL permissions
  async createBookingByTag() {
    // User must have both permissions
  }
}
```

### **Predefined Permission Groups**

```typescript
import { RequireAssetPermissions, RequireCrmPermissions } from 'src/auth/decorators/permissions.decorator';

@Controller('assets')
export class AssetsController {
  @UseGuards(RequireAssetPermissions())
  async manageAssets() {
    // User must have all asset permissions (read, write, delete)
  }
}

@Controller('crm')
export class CrmController {
  @UseGuards(RequireCrmPermissions())
  async manageCrm() {
    // User must have all CRM permissions
  }
}
```

## 🛡️ **Guard Integration**

### **Controller-Level Guards**

```typescript
@Controller('maintenance')
@UseGuards(UniversalGuard, TenantGuard, PermissionsGuard)
export class MaintenanceController {
  // All methods require authentication, tenant validation, and permission checking
}
```

### **Method-Level Guards**

```typescript
@Controller('maintenance')
export class MaintenanceController {
  @Post()
  @RequireWrite('maintenance')
  async createMaintenance() {
    // This method requires maintenance:write permission
  }
}
```

### **Custom Permission Checks**

```typescript
@Controller('users')
export class UsersController {
  @Put(':id/roles')
  @RequirePermissionsDecorator(['users:roles:manage'])
  async updateUserRoles() {
    // User must have users:roles:manage permission
  }
}
```

## 🔧 **Available Permission Decorators**

### **Resource-Based Decorators**
- `@RequireRead('resource')` - Requires `resource:read` permission
- `@RequireWrite('resource')` - Requires `resource:write` permission  
- `@RequireDelete('resource')` - Requires `resource:delete` permission

### **Predefined Permission Groups**
- `@RequireAssetPermissions()` - All asset permissions
- `@RequireUserPermissions()` - All user permissions
- `@RequireBookingPermissions()` - All booking permissions
- `@RequireCrmPermissions()` - All CRM permissions
- `@RequireBillingPermissions()` - All billing permissions
- `@RequireAnalyticsPermissions()` - All analytics permissions
- `@RequireSystemAdmin()` - System admin permission
- `@RequireTenantAdmin()` - Tenant admin permissions

### **Flexible Permission Decorators**
- `@RequireAnyPermission(['perm1', 'perm2'])` - User needs ANY permission
- `@RequireAllPermissions(['perm1', 'perm2'])` - User needs ALL permissions
- `@RequirePermissionsDecorator(['perm1', 'perm2'], true)` - Custom with requireAll flag

## 📋 **Permission Scopes**

### **Asset Management**
- `assets:read` - View assets
- `assets:write` - Create/update assets
- `assets:delete` - Delete assets
- `assets:properties:manage` - Manage asset properties

### **User Management**
- `users:read` - View users
- `users:write` - Create/update users
- `users:delete` - Delete users
- `users:roles:manage` - Manage user roles

### **Booking Management**
- `bookings:read` - View bookings
- `bookings:write` - Create/update bookings
- `bookings:delete` - Delete bookings
- `bookings:cancel` - Cancel bookings
- `bookings:by-tag:create` - Create bookings by tag

### **CRM Operations**
- `crm:read` - View CRM data
- `crm:write` - Create/update CRM data
- `crm:delete` - Delete CRM data
- `contacts:read/write/delete` - Contact management
- `inquiries:read/write/delete/assign` - Inquiry management
- `tasks:read/write/delete/assign` - Task management

### **System Administration**
- `system:admin` - Full system access
- `tenants:read/write/delete` - Tenant management
- `keys:read/write/delete` - API key management

## 🔄 **Migration Guide**

### **From Public Endpoints**
```typescript
// Before
@Get()
async getData() {
  // Public endpoint
}

// After
@Get()
@RequireRead('data')
async getData() {
  // Protected endpoint
}
```

### **From Role-Based Guards**
```typescript
// Before
@UseGuards(RolesGuard)
@Roles('admin')
async adminOnly() {
  // Admin only
}

// After
@RequireSystemAdmin()
async adminOnly() {
  // System admin only
}
```

## 🧪 **Testing**

### **Unit Testing Guards**
```typescript
describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access when user has required permissions', () => {
    // Test implementation
  });
});
```

### **Integration Testing**
```typescript
describe('Assets Controller', () => {
  it('should require assets:read permission for GET /assets', async () => {
    // Test with and without proper permissions
  });
});
```

## 🚨 **Error Handling**

The system provides clear error messages:

- **401 Unauthorized** - Authentication failed
- **403 Forbidden** - Insufficient permissions
- **400 Bad Request** - Missing tenant ID or invalid request

### **Common Error Scenarios**
```typescript
// User not authenticated
throw new UnauthorizedException('User not authenticated');

// No tenant access
throw new ForbiddenException('Access denied to this tenant');

// Insufficient permissions
throw new ForbiddenException('Insufficient permissions. Required: assets:write');
```

## 🔒 **Security Best Practices**

1. **Always use specific permissions** over broad ones
2. **Validate tenant access** for every request
3. **Log permission checks** for audit trails
4. **Use principle of least privilege** - grant minimal required permissions
5. **Regular permission audits** to ensure proper access control

## 📚 **Additional Resources**

- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [JWT Best Practices](https://jwt.io/introduction)
- [RBAC Implementation Guide](https://en.wikipedia.org/wiki/Role-based_access_control)

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Guard Not Working**
   - Ensure guards are applied in correct order
   - Check that decorators are imported correctly
   - Verify user object contains required data

2. **Permission Denied Errors**
   - Check user's role assignments
   - Verify role permissions are correct
   - Ensure tenant access is valid

3. **Token Issues**
   - Check JWT expiration
   - Verify token contains required claims
   - Ensure proper token format

### **Debug Mode**
Enable debug logging to see detailed permission checks:
```typescript
// In main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['debug', 'log', 'warn', 'error'],
});
```
