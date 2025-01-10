"use client"

import React, { use } from 'react'
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/api/useSession';
import { deleteSession } from '@/lib/api/session';

export default function Logout() {
    const { mutate, isPending } = authClient.auth.logout.useMutation();
    const session = useSession();
    const router = useRouter();

    console.log('session', session);
  return (
    <Button onClick={() => mutate({
      body: {
        refreshToken: session?.refreshToken as string
      }
    },{
        onSuccess:  (response) => {
            console.log('response', response);
            deleteSession();
            router.push('/login');
        }
    })}>
                Logout
    </Button>
  )
}

