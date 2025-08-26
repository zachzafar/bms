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

    const handleLogout = () => {
        if (user) {
            mutate({
                body: {
                    userId: user.id
                }
            }, {
                onSuccess: async (response) => {
                    await deleteSession();
                    // Redirect to auth app instead of /login
                    const authUrl = process.env.NODE_ENV === 'production' 
                        ? 'https://bookos.xyz'
                        : 'http://localhost:3002';
                    window.location.href = authUrl;
                }
            });
        }
    };
    
    return (
        <Button 
            disabled={isPending || user == null} 
            onClick={handleLogout}
        >
            Logout
        </Button>
    );
}

