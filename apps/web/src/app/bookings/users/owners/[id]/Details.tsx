'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';

  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Textarea } from '@/components/ui/textarea';
  import { Button } from '@/components/ui/button';
  import { toast } from 'sonner';

export default function Details({ userId }: { userId: string }) {
  const tenant = StorageService.getTenant();
 

  // Fetch owners for display and refetch support
  const { data: ownersData, isLoading: ownersLoading, refetch } = authClient.users.getOwners.useQuery({
    queryKey: ['owners'],
    enabled: !!tenant,
  });

  // Preserve roles on update
  const { data: usersData } = authClient.users.getUsers.useQuery({
    queryKey: ['users'],
    enabled: !!tenant,
  });

  const owners = ownersData?.body.data ?? [];
  const selected = useMemo(() => owners.find((o: any) => o.user.id === userId), [owners, userId]);
  const rolesForUser: number[] = useMemo(() => {
    const users = usersData?.body.data ?? [];
    const u = users.find((u: any) => u.id === userId);
    return (u?.roles ?? []).map((r: any) => r.roleId as number);
  }, [usersData, userId]);

  const [name, setName] = useState(selected?.user?.name ?? '');
  const [email, setEmail] = useState(selected?.user?.email ?? '');
  const [phone, setPhone] = useState(selected?.owner?.phone ?? '');
  const [address, setAddress] = useState(selected?.owner?.address ?? '');
  const [taxId, setTaxId] = useState(selected?.owner?.taxId ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(selected?.user?.name ?? '');
    setEmail(selected?.user?.email ?? '');
    setPhone(selected?.owner?.phone ?? '');
    setAddress(selected?.owner?.address ?? '');
    setTaxId(selected?.owner?.taxId ?? '');
  }, [selected?.user?.name, selected?.user?.email, selected?.owner?.phone, selected?.owner?.address, selected?.owner?.taxId]);

  const { mutate: updateUser } = authClient.users.updateUser.useMutation();

  if (ownersLoading || !selected) return <Loading />;

  const hasChanges =
    name !== (selected.user?.name ?? '') ||
    email !== (selected.user?.email ?? '') ||
    phone !== (selected.owner?.phone ?? '') ||
    address !== (selected.owner?.address ?? '') 
    
    
  const handleSave = () => {
    if (!hasChanges) return;
    setIsSubmitting(true);

    updateUser(
      {
        params: { id: userId },
        body: {
          user: { name, email, userType: 'owner' }, // keeps owner role active
          roles: rolesForUser,
          owner: {
            userId, // required by UpdateOwnerSchema
            phone: phone || null,
            address: address || null,
            taxId: taxId || null,
          },
        },
      },
      {
        onSuccess: async () => {
          toast.success('Owner profile updated');
          await refetch();
          setIsSubmitting(false);
        },
        onError: () => {
          toast.error('Failed to update owner profile');
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isSubmitting} />
          </div>
          {hasChanges && (
            <div className="md:col-span-2">
              <Button onClick={handleSave} disabled={isSubmitting}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}