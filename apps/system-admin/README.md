# BookOS System Admin

A centralized system administration dashboard for managing tenants, users, roles, and API keys across the entire BookOS platform.

## Features

### 🏢 **Tenant Management**
- Create, edit, and manage multi-tenant organizations
- View tenant statistics and status
- Manage tenant-specific settings and configurations

### 👥 **User Management**
- Create and manage user accounts across all tenants
- Assign users to specific tenants
- Manage user roles and permissions
- Filter users by tenant

### 🛡️ **Role Management**
- Define and manage user roles and access levels
- Assign permissions to roles
- View role usage statistics
- Manage system-wide permissions

### 🔑 **API Key Management**
- Generate and manage API keys for integrations
- Assign API keys to specific tenants
- Set permissions and expiration dates
- Monitor API key usage

### 📊 **System Overview**
- Dashboard with system-wide statistics
- Real-time monitoring of platform health
- Performance metrics and analytics

## Development

### Prerequisites
- Node.js 18+
- pnpm
- Access to the BookOS API

### Setup
1. Copy `env.example` to `.env.local`
2. Update environment variables as needed
3. Install dependencies: `pnpm install`
4. Start development server: `pnpm dev`

### Environment Variables
- `PORT`: Port for the development server (default: 3003)
- `NEXT_PUBLIC_API_URL`: URL of the BookOS API

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting

## Architecture

The System Admin app is built with:
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and state management
- **ts-rest** - Type-safe API client
- **shadcn/ui** - Reusable UI components

## API Integration

The app integrates with the BookOS API through:
- **Auth Contract** - Authentication and authorization
- **Users Contract** - User management operations
- **Tenant Contract** - Tenant management operations

## Security

- System administrators have full access to all tenants and users
- All operations are logged and audited
- Role-based access control for different admin functions
- Secure API key management with expiration and permissions

## Deployment

The System Admin app is designed to run alongside other BookOS applications:
- **Development**: `localhost:3003`
- **Production**: `admin.bookos.xyz` (or similar subdomain)

## Access Control

This application is restricted to system administrators only. Regular users and tenant administrators should not have access to this dashboard.

