import mem from "mem";
import { client } from "./publicClient";
import { deleteSession, getSession, updateTokens } from "./session";
import axios from "axios";



const refreshTokenFn = async () => {
    
    const currentSession =  await getSession()
    console.log("checking session:", currentSession)
    if (currentSession === null) return null;
   
    try {
      console.log("refreshing token")
      const response = await axios.request({
        method: "POST",
        url: "http://localhost:3001" + "/refresh",
        data: {
          refresh: currentSession.refreshToken
        }
      })

      
      console.log("Status", response.status)
      console.log("response data:", response.data)
      if (response.status !== 201) {
        deleteSession();
        return null;
      }

      console.log("updating tokens:", response.data)
     await updateTokens({ accessToken: response.data.body.token, refreshToken: response.data.body.refreshToken });
      console.log("returning tokens")
     return { accessToken: response.data.token, refreshToken: response.data.refreshToken };
  
      
    } catch (error) {
      console.log("error refreshing token, deleting session", error)
      deleteSession();
    }
  };
  
  const maxAge = 10000;
  
  export const memoizedRefreshToken = mem(refreshTokenFn, {
    maxAge,
  });
