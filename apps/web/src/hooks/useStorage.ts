import { useEffect, useState } from "react";
import { StorageService } from "@/lib/api/storage";
import { SelectTenant, SelectUser } from "@/lib/api-contract";

export const useStorage = () => {
    const [token, setToken] = useState<string | null>();
    const [user, setUser] = useState<Omit<SelectUser,"password">| null>();
    const [tenant, setTenant] = useState<SelectTenant | null>();
    const [tenantList, setTenantList] = useState<SelectTenant[] | null>();

    
    
    useEffect(() => {
        StorageService.getToken().then(setToken);
        setUser(StorageService.getUser());
        setTenant(StorageService.getTenant());
        setTenantList(StorageService.getTenantList());
    },[])

    return {
        token,
        user,
        tenant,
        tenantList
    }

}