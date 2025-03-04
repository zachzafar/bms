import { useEffect, useState } from "react";
import { useSession } from "./useSession"
import { authClient } from "./publicClient";
import { SelectTenant } from "@repo/api-contract";

export const useTenant = () => {
    const { session, loading } = useSession();
    const [currentTenant, setCurrentTenant] = useState<SelectTenant | undefined>();
    const [tenantList, setTenantList] = useState<SelectTenant[]>([]);
     const { data } = authClient.tenants.getTenantsDetails.useQuery({ queryKey: ['tenants'], enabled: !loading, queryData: {
        query: {
            tenants: session?.tenants || []
        }
    }})

    useEffect(() => {
        if (data?.status === 200){
            setTenantList(data.body)
            setCurrentTenant(() => {
                if (session?.tenants.length === 1) {
                    return data.body.find(tenant => tenant.id === session.tenants[0])
                }
                return undefined
            })
        }
    }, [data, session])

    return { currentTenant, setCurrentTenant, tenantList, loading }
}