# BookOS Startup Guide

This guide explains how to start all applications in the correct order to avoid CORS and connection issues.

## 🚀 Quick Start

### 1. Start the API Backend First
```bash
# Terminal 1 - Start the API backend
pnpm run dev:api
```
**Wait for this message**: `Application is running on: http://localhost:3001`

### 2. Start the Auth App
```bash
# Terminal 2 - Start the Auth app
pnpm run dev:auth
```
**Wait for this message**: `Ready - started server on 0.0.0.0:3002`

### 3. Start the Web App (Optional)
```bash
# Terminal 3 - Start the Web app
pnpm run dev:web
```

### 4. Start the CRM App (Optional)
```bash
# Terminal 4 - Start the CRM app
pnpm run dev:crm
```

## 📱 Application URLs

| Application | Port | URL | Status |
|-------------|------|-----|---------|
| **API Backend** | 3001 | http://localhost:3001 | 🟢 Required First |
| **Auth App** | 3002 | http://localhost:3002 | 🟢 Required Second |
| **Web App** | 3000 | http://localhost:3000 | 🟡 Optional |
| **CRM App** | 3001 | 🚫 **Port Conflict** | ❌ Cannot run with API |

## ⚠️ Important Notes

### Port Conflicts
- **CRM App cannot run** on port 3001 because the API uses that port
- **Web App** can run on port 3000 (no conflicts)
- **Auth App** runs on port 3002 (no conflicts)

### CORS Configuration
The API backend has CORS enabled for:
- `http://localhost:3000` (Web App)
- `http://localhost:3001` (CRM App - when not conflicting)
- `http://localhost:3002` (Auth App)

### Startup Order
1. **API Backend** must start first
2. **Auth App** must start second
3. Other apps can start in any order

## 🔧 Troubleshooting

### CORS Errors
If you see CORS errors:
1. Make sure the API backend is running on port 3001
2. Check that CORS is properly configured in the API
3. Verify the auth app is making requests to the correct API URL

### Port Already in Use
```bash
# Check what's using a port
lsof -i :3001
lsof -i :3002
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### API Connection Issues
If the auth app can't connect to the API:
1. Verify the API is running: `curl http://localhost:3001/api-docs`
2. Check the environment variables in `apps/auth/.env.local`
3. Ensure `NEXT_PUBLIC_API_URL=http://localhost:3001`

## 🎯 Testing the Setup

### 1. Test API Backend
```bash
curl http://localhost:3001/api-docs
# Should return HTML for Swagger docs
```

### 2. Test Auth App
- Visit http://localhost:3002
- You should see the landing page
- Click "Sign In" to test the login form

### 3. Test Cross-App Communication
- Login through the auth app
- Select an application
- Verify the redirect works properly

## 📚 Environment Files

Make sure you have the correct environment files:

```bash
# Copy environment templates
cp apps/api/env.example apps/api/.env
cp apps/auth/env.example apps/auth/.env.local
cp apps/web/env.example apps/web/.env.local
cp apps/crm/env.example apps/crm/.env.local
```

## 🚨 Common Issues

### Issue: "Cannot read properties of undefined (reading 'headers')"
**Solution**: The API backend is not running or not accessible. Start the API first.

### Issue: "CORS policy blocked"
**Solution**: The API backend is not running or CORS is not configured. Start the API first.

### Issue: "Port 3001 already in use"
**Solution**: The CRM app is trying to use the same port as the API. Use different ports or don't run both simultaneously.

## 🔄 Alternative Startup Methods

### Using Turbo (may have port conflicts)
```bash
pnpm run dev
```

### Manual Startup with Custom Ports
```bash
# API on 3001
cd apps/api && PORT=3001 pnpm dev

# Auth on 3002
cd apps/auth && PORT=3002 NEXT_PUBLIC_API_URL=http://localhost:3001 pnpm dev

# Web on 3000
cd apps/web && PORT=3000 NEXT_PUBLIC_API_URL=http://localhost:3001 NEXT_PUBLIC_AUTH_URL=http://localhost:3002 pnpm dev

# CRM on 3003 (different port to avoid conflict)
cd apps/crm && PORT=3003 NEXT_PUBLIC_API_URL=http://localhost:3001 NEXT_PUBLIC_AUTH_URL=http://localhost:3002 pnpm dev
```

## 📞 Support

If you continue to have issues:
1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Ensure no other services are using the required ports
4. Check the API logs for any backend errors
