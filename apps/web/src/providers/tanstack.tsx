// app/providers.tsx
'use client'
import { authClient } from '@/lib/api/publicClient'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


export default function TanstackProvider({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
     <authClient.ReactQueryProvider>{children}</authClient.ReactQueryProvider> 
    </QueryClientProvider>
  )
}