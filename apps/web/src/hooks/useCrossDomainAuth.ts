import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { toast } from 'sonner';

export function useCrossDomainAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token from URL params (redirected from auth app)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const tenantId = urlParams.get('tenant');

        if (token && tenantId) {
          // Validate the token with the API
          const response = await authClient.auth.validateToken.mutate({
            body: { token, tenantId }
          });

          if (response.status === 200 && response.body.valid) {
            // Store the validated token and user data
            StorageService.setToken(token);
            StorageService.setUser(response.body.user);
            StorageService.setTenant(response.body.tenant);
            
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setIsAuthenticated(true);
            toast.success('Successfully authenticated');
          } else {
            // Invalid token, redirect to auth app
            redirectToAuth();
          }
        } else {
          // Check if we have a stored token
          const storedToken = await StorageService.getToken();
          if (storedToken) {
            setIsAuthenticated(true);
          } else {
            // No token, redirect to auth app
            redirectToAuth();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        redirectToAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const redirectToAuth = () => {
    const authUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bookos.xyz/login'
      : 'http://localhost:3002/login';
    
    window.location.href = authUrl;
  };

  const logout = () => {
    StorageService.removeToken();
    StorageService.removeUser();
    StorageService.removeTenant();
    setIsAuthenticated(false);
    redirectToAuth();
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
    redirectToAuth
  };
}
