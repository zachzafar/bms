'use client';

import { authClient } from '@/lib/api/publicClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

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
