"use client"

import React from 'react'
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';

export default function Logout() {
    const { mutate, isPending } = authClient.auth.logout.useMutation();
    const router = useRouter();
  return (
    <Button onClick={() => mutate({},{
        onSuccess: async (response) => {
            console.log('response', response);
            router.push('/login');
        }
    })}>
                Logout
    </Button>
  )
}

