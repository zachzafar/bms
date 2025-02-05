"use client"

import React, { use } from 'react'
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/api/useSession';
import { deleteSession } from '@/lib/api/session';

export default function Logout() {
    const { mutate, isPending } = authClient.auth.logout.useMutation();
    const {session, loading} = useSession();
    const router = useRouter();
    
  return (
    <Button disabled={isPending || loading} onClick={() => session ? mutate({
      body: {
        userId: session.user.id
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

