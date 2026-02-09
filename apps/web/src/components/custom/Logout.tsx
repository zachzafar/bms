"use client"

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { useStorage } from '@/hooks/useStorage';

export default function Logout() {
    const { mutate, isPending } = authClient.auth.logout.useMutation();
    const { user } = useStorage()

    const handleLogout = () => {
        if (user) {
            mutate({
                body: {
                    userId: user.id
                }
            }, {
                onSuccess: async () => {
                    await StorageService.clearAll();

                    const authUrl = process.env.NODE_ENV === 'production'
                        ? 'https://app.bookos.xyz'
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
