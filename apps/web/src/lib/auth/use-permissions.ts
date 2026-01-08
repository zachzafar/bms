// lib/auth/usePermissions.ts
"use client"

import { authClient } from "@/lib/api/publicClient"
import { StorageService } from "@/lib/api/storage"
import { useQuery } from "@tanstack/react-query"

export function usePermissions() {
  const tenant = StorageService.getTenant()

  const { data, isLoading } = useQuery({
    queryKey: ["permissions", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const res = await authClient.auth.getPermissions.query({
        extraHeaders: {
          "x-tenant-id": tenant!.id,
        },
      })

      if (res.status !== 200) return []
      return res.body
    },
  })

  return {
    permissions: data ?? [],
    loading: isLoading,
  }
}
