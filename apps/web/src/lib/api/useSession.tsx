import { use, useEffect, useState } from "react";
import { getSession, Session } from "./session";



export const useSession = () => {
    const [session,setSession] = useState<Session>()
    const [loading, setLoading] = useState(true)
     
     useEffect(() => {
        
        getSession().then((session) => {
            if (session) {
                setSession(session)
            }
            setLoading(false)
        })
     },[])
        return {session, loading};
}