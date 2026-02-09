"use client"

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import { StorageService } from '@/lib/api/storage';
import { useStorage } from '@/hooks/useStorage';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface OwnerLogoutProps {
  subdomain: string;
}

export default function OwnerLogout({ subdomain }: OwnerLogoutProps) {
  const { mutate, isPending } = authClient.auth.logout.useMutation();
  const { user } = useStorage();
  const router = useRouter();

  const handleLogout = () => {
    if (user) {
      mutate({
        body: {
          userId: user.id
        }
      }, {
        onSuccess: async () => {
          await StorageService.clearAll();
          toast.success('Logged out successfully');
          router.replace(`/owner/${subdomain}/login`);
        },
        onError: () => {
          toast.error('Logout failed');
        }
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending || user == null}
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}
