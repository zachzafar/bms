import { initClient } from "@ts-rest/core";
import { contract } from "@repo/api-contract";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import  axios from 'axios';
import { memoizedRefreshToken } from "./refreshToken";
import { get } from "http";
import { getSession } from "./session";



export const client = initTsrReactQuery(contract,{
    baseUrl: 'http://localhost:3001',
})


const axiosInstance = axios.create({

})

axiosInstance.interceptors.request.use(
    async (config) => {
      const session = await getSession();
  
      if (session) {
        config.headers = new axios.AxiosHeaders({
          ...config.headers,
          authorization: `Bearer ${session.accessToken}`,
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
            authorization: `Bearer ${result.accessToken}`,
          });
        
  
        return axios(config);
      }
      return Promise.reject(error);
    }
  );


export const authClient = initTsrReactQuery(contract, {
    baseUrl: 'http://localhost:3001',
    axiosInstance
})