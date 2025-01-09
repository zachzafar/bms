import { contract } from "@repo/api-contract";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import  axios, { AxiosError, AxiosResponse, isAxiosError, Method } from 'axios';
import { memoizedRefreshToken } from "./refreshToken";
import { getSession } from "./session";

const baseUrl = 'http://localhost:3001';

export const client = initTsrReactQuery(contract,{
    baseUrl
})


const axiosInstance = axios.create({

})

axiosInstance.interceptors.request.use(
    async (config) => {
      const session = await getSession();
      console.log('session', session)
      if (session) {
        config.headers = new axios.AxiosHeaders({
          ...config.headers,
          Authorization: `Bearer ${session.accessToken}`,
        });
      }
  
      return config
    })

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config;
  
      if (error?.response?.status === 401 && !config?.sent) {
        config.sent = true;
  
        const result = await memoizedRefreshToken();

        if (!result) {
          return Promise.reject(error);
        }
  
       
          config.headers = new axios.AxiosHeaders({
            ...config.headers,
            Authorization: `Bearer ${result.accessToken}`,
          });
        
  
        return axios(config);
      }
      return Promise.reject(error);
    }
  );


export const authClient = initTsrReactQuery(contract, {
    baseUrl,
    baseHeaders: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${(await getSession())?.accessToken || ''}`
      },
      api: async ({ path, method, headers, body }) => {
        try {
          const result = await axiosInstance.request({
            method: method as Method,
            url: `${baseUrl}/${path}`,
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