# BookOS Authentication Architecture

## Overview

This document describes the new centralized authentication architecture for BookOS, which provides a single sign-on experience across multiple subdomain applications.

## Architecture Components

### 1. Centralized Auth App (`apps/auth`)
- **Port**: 3002 (development)
- **Production URL**: `bookos.xyz`
- **Purpose**: Central authentication hub, user management, and app selection

### 2. Booking Platform (`apps/web`)
- **Port**: 3000 (development)
- **Production URL**: `booking.bookos.xyz`
- **Purpose**: Property booking and management

### 3. CRM System (`apps/crm`)
- **Port**: 3001 (development)
- **Production URL**: `crm.bookos.xyz`
- **Purpose**: Customer relationship management

## Authentication Flow

### 1. User Login
1. User navigates to `bookos.xyz` (or `localhost:3002` in development)
2. User enters credentials on the centralized login page
3. Upon successful authentication, user is redirected to the apps selection page

### 2. App Selection
1. User sees available applications (Booking Platform, CRM System)
2. User clicks on desired application
3. System redirects to the selected app with authentication tokens

### 3. Cross-Domain Authentication
1. User is redirected to the selected app (e.g., `booking.bookos.xyz`)
2. App receives authentication tokens via URL parameters
3. App validates tokens with the API
4. User is authenticated and can access the application

## Technical Implementation

### Cross-Domain Authentication
- **Token Validation**: New `/validate-token` endpoint in the auth API
- **URL Parameters**: Authentication tokens passed via query parameters during redirect
- **Session Management**: Each app maintains its own session after token validation

### Security Features
- **HTTP-Only Cookies**: Session cookies for the auth app
- **Token Validation**: Server-side validation of authentication tokens
- **Automatic Redirects**: Unauthenticated users are automatically redirected to the auth app

## Development Setup

### 1. Start All Applications
```bash
# Terminal 1 - Auth App
cd apps/auth
pnpm dev

# Terminal 2 - Booking Platform
cd apps/web
pnpm dev

# Terminal 3 - CRM System
cd apps/crm
pnpm dev
```

### 2. Access Points
- **Auth App**: http://localhost:3002
- **Booking Platform**: http://localhost:3000
- **CRM System**: http://localhost:3001

### 3. Authentication Flow
1. Visit http://localhost:3002
2. Login with valid credentials
3. Select an application
4. You'll be redirected to the selected app with authentication

## Production Configuration

### Environment Variables
```bash
# Auth App
NEXT_PUBLIC_API_URL=https://api.bookos.xyz
DOMAIN=.bookos.xyz
SECURE=true

# Booking Platform
NEXT_PUBLIC_API_URL=https://api.bookos.xyz
NEXT_PUBLIC_AUTH_URL=https://bookos.xyz

# CRM System
NEXT_PUBLIC_API_URL=https://api.bookos.xyz
NEXT_PUBLIC_AUTH_URL=https://bookos.xyz
```

### DNS Configuration
- `bookos.xyz` → Auth App
- `booking.bookos.xyz` → Booking Platform
- `crm.bookos.xyz` → CRM System
- `api.bookos.xyz` → Backend API

## API Endpoints

### New Authentication Endpoints
- `POST /validate-token` - Validate authentication tokens for cross-domain access
- `POST /login` - User authentication
- `POST /refresh` - Token refresh
- `POST /logout` - User logout

## Security Considerations

### 1. Token Security
- Tokens are short-lived and validated server-side
- Refresh tokens are used for long-term authentication
- All tokens are transmitted over HTTPS in production

### 2. Cross-Origin Protection
- CORS policies are configured for subdomain access
- SameSite cookie policies prevent CSRF attacks
- HTTP-Only cookies prevent XSS token theft

### 3. Session Management
- Centralized session management in the auth app
- Automatic session cleanup and expiration
- Secure cookie configuration

## Troubleshooting

### Common Issues

#### 1. Authentication Redirect Loop
- Check that the auth app is running on the correct port
- Verify environment variables are set correctly
- Ensure middleware is not blocking authentication requests

#### 2. Token Validation Failures
- Check API connectivity between apps
- Verify token format and expiration
- Check tenant ID matching

#### 3. Cross-Domain Issues
- Ensure proper CORS configuration
- Check cookie domain settings
- Verify subdomain routing

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_AUTH=true
```

## Future Enhancements

### 1. Single Sign-On (SSO)
- Integration with external identity providers
- OAuth 2.0 and OpenID Connect support
- Multi-factor authentication

### 2. Advanced Security
- Rate limiting and brute force protection
- IP-based access controls
- Audit logging and monitoring

### 3. User Management
- Role-based access control (RBAC)
- Permission management
- User activity tracking

## Support

For technical support or questions about the authentication architecture, please contact the development team or create an issue in the project repository.
