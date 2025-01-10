import { use, useEffect, useState } from "react";
import { getSession, Session } from "./session";



export const useSession = () => {
    const [session,setSession] = useState<Session>()
     
     useEffect(() => {
        getSession().then((session) => {
            if (session) {
                setSession(session)
            }
        })
     },[])
        return session;
}