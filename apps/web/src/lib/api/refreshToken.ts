import mem from "mem";
import { client } from "./publicClient";
import { deleteSession, getSession, updateTokens } from "./session";




const refreshTokenFn = async () => {
    
    const currentSession =  await getSession()
    console.log("checking session:", currentSession)
    if (currentSession === null) return null;
   
    try {
      console.log("refreshing token")
      const response = await client.auth.refreshToken.mutate({
        headers: {
          user: ''
        },
        body: {
            refresh: currentSession.refreshToken,
        }
      })
      
      console.log("Status", response.status)

      if (response.status !== 201) {
        deleteSession();
        return null;
      }

      console.log("updating tokens")
     await updateTokens({ accessToken: response.body.token, refreshToken: response.body.refreshToken });

     return { accessToken: response.body.token, refreshToken: response.body.refreshToken };
  
      
    } catch (error) {
      console.log("error refreshing token, deleting session", error)
      deleteSession();
    }
  };
  
  const maxAge = 10000;
  
  export const memoizedRefreshToken = mem(refreshTokenFn, {
    maxAge,
  });
