'use client';

import { authClient } from '@/lib/api/publicClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const queryClient = new QueryClient(); // ⬅️ export it so you can import elsewhere

// ✅ Extract the properly-cased provider
const TsRestProvider = authClient.ReactQueryProvider;

export default function TanstackProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TsRestProvider>
        {children}
      </TsRestProvider>
    </QueryClientProvider>
  );
}
