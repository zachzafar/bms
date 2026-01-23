'use server';

import mem from "mem";
import { client } from "./publicClient";
import { deleteSession, getSession, updateTokens } from "./session";
import axios from "axios";
import { redirect } from 'next/navigation';


const refreshTokenFn = async () => {
    
    const currentSession =  await getSession()

    if (currentSession === null) {
      redirect("/login");
      return null;
    }
    try {
      console.log("refreshing token")
      const response = await axios.request({
        method: "POST",
        url: "http://localhost:4000" + "/refresh",
        data: {
          refresh: currentSession.refreshToken
        }
      })

      if (response.status !== 201) {
        deleteSession();
        redirect("/login");
        return null;
      }
  
     await updateTokens(response.data.body.refreshToken,response.data.body.token);
      
     return { accessToken: response.data.body.token, refreshToken: response.data.body.refreshToken };
  
      
    } catch (error) {
      deleteSession();
      redirect("/login");
      return null
    }
  };
  
  const maxAge = 10000;
  
  export const memoizedRefreshToken = mem(refreshTokenFn, {
    maxAge,
  });
