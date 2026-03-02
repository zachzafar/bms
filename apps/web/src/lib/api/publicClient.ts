import { contract } from "@repo/api-contract";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import  axios, { AxiosError, AxiosResponse, isAxiosError, Method } from 'axios';
import { memoizedRefreshToken } from "./refreshToken";
import { getSession } from "./session";
import { StorageService } from "./storage";

export const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// Public axios instance (no auth)
const publicAxiosInstance = axios.create({
  baseURL: baseUrl,
});

export const client = initTsrReactQuery(contract, {
    baseUrl,
    api: async ({ path, method, headers, body }) => {
      try {
        console.log(path)
        const result = await publicAxiosInstance.request({
          method: method as Method,
          url: path,
          headers,
          data: body,
        });

        const headersObj = new Headers();
        Object.entries(result.headers).forEach(([key, value]) => {
          if (value) headersObj.append(key, value.toString());
        });

        return { status: result.status, body: result.data, headers: headersObj };
      } catch (e: Error | AxiosError | any) {
        console.error(e)
        if (isAxiosError(e)) {
          const error = e as AxiosError;
          const response = error.response as AxiosResponse;

          const headersObj = new Headers();
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value) headersObj.append(key, value.toString());
          });

          return { status: response.status, body: response.data, headers: headersObj };
        }
        throw e;
      }
    },
});

// Authenticated axios instance
const axiosInstance = axios.create({
  baseURL: baseUrl,
})

axiosInstance.interceptors.request.use(
    async (config) => {
      const accessToken = await StorageService.getToken()
      const tenant = StorageService.getTenant()
      if (accessToken && tenant) {
        config.headers = new axios.AxiosHeaders({
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
          "x-tenant-id": tenant.id,
        });

        if (config.data instanceof FormData) {
          console.log(config.data)
          config.headers['Content-Type'] = "multipart/form-data"
        }
      }
  
      return config
    })

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config;
      
      if (error?.response?.status === 401 && !config?.sent) {
        config.sent = true;

        // Owner session — don't attempt admin refresh; clear session and redirect to login
        const ownerUser = StorageService.getOwnerUser();
        if (ownerUser && typeof window !== 'undefined') {
          StorageService.removeOwnerUser();
          StorageService.removeToken();
          // Derive subdomain from the current path: /owner/[subdomain]/...
          const match = window.location.pathname.match(/^\/owner\/([^/]+)/);
          const subdomain = match?.[1] ?? '';
          window.location.href = `/owner/${subdomain}/login`;
          return Promise.reject(error);
        }

        const result = await memoizedRefreshToken();

        if (!result) {
          return Promise.reject(error);
        }

        StorageService.setToken(result.accessToken)
          config.headers = new axios.AxiosHeaders({
            ...config.headers,
            Authorization: `Bearer ${result.accessToken}`,
          });


        return axios(config);
      }
      return Promise.reject(error);
    }
  );

export const axiosClient = axiosInstance

export const authClient = initTsrReactQuery(contract, {
    baseUrl,
      api: async ({ path, method, headers, body }) => {
        try {
          const result = await axiosInstance.request({
            method: method as Method,
            url: path,
            headers,
            data: body,
          });

          const headersObj = new Headers();
      Object.entries(result.headers).forEach(([key, value]) => {
        if (value) headersObj.append(key, value.toString());
      });

          return { status: result.status, body: result.data, headers: headersObj };
        } catch (e: Error | AxiosError | any) {
          if (isAxiosError(e)) {
            const error = e as AxiosError;
            const response = error.response as AxiosResponse;

            const headersObj = new Headers();
            Object.entries(response.headers).forEach(([key, value]) => {
            if (value) headersObj.append(key, value.toString());
            });


            return { status: response.status, body: response.data, headers: headersObj };
          }
          throw e;
        }
      },
});