"use client"

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import { deleteSession } from '@/lib/api/session';
import { useStorage } from '@/hooks/useStorage';

export default function Logout() {
    const { mutate, isPending } = authClient.auth.logout.useMutation();
    const { user } = useStorage()
    const router = useRouter();

    
  return (
    <Button disabled={isPending || user == null} onClick={() => user ? mutate({
      body: {
        userId: user?.id
      }
    },{
        onSuccess:  async (response) => {
            await deleteSession();
            router.push('/login');
        }
    }): null}>
                Logout
    </Button>
  )
}

