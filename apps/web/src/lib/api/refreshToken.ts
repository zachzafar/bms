import mem from "mem";
import { client } from "./publicClient";
import { deleteSession, getSession, updateTokens } from "./session";




const refreshTokenFn = async () => {
    
    const currentSession =  await getSession()

    if (currentSession === null) return null;
  
    try {
      const response = await client.auth.refreshToken.mutate({
        headers: {
          user: currentSession.user,
        },
        body: {
            refresh: currentSession.refreshToken,
        }
      })
  
      if (response.status !== 200) {
        deleteSession();
        return null;
      }


     await updateTokens({ accessToken: response.body.token, refreshToken: response.body.refreshToken });

     return { accessToken: response.body.token, refreshToken: response.body.refreshToken };
  
      
    } catch (error) {
      deleteSession();
    }
  };
  
  const maxAge = 10000;
  
  export const memoizedRefreshToken = mem(refreshTokenFn, {
    maxAge,
  });
