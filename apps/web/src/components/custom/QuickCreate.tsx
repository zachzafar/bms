'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { ASSET_TYPE_QUERY_KEY, RATE_TYPES_QUERY_KEY } from '@/lib/api/queryKeys';
import { PlusCircle } from 'lucide-react';
import { StorageService } from '@/lib/api/storage';

interface QuickCreateLinkProps {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}

export function QuickCreateLink({ label, onClick }: QuickCreateLinkProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
    >
      <PlusCircle className="h-3 w-3" />
      {label}
    </button>
  );
}

// --- Asset Type Quick Create ---

function AssetTypeForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const queryClient = authClient.useQueryClient();
  const tenant = StorageService.getTenant();

  const { mutate, isPending } = authClient.settings.assetType.createAssetType.useMutation({
    onSuccess: () => {
      toast.success('Asset type created');
      queryClient.invalidateQueries({ queryKey: ASSET_TYPE_QUERY_KEY });
      setName('');
      onSuccess();
    },
    onError: () => toast.error('Failed to create asset type'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;
    mutate({
      body: {
        assetType: { name: name.trim(), tenantId: tenant?.id as string },
        properties: [],
        forms: [],
        tagIds: [],
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="asset-type-name">Name</Label>
        <Input
          id="asset-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Car, Room, Equipment"
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
        {isPending ? 'Creating...' : 'Create Asset Type'}
      </Button>
    </form>
  );
}

export function QuickCreateAssetType({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <QuickCreateLink label="Create Asset Type" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Quick Create Asset Type</DialogTitle>
            <DialogDescription>Add a new asset type. You can configure properties and forms later.</DialogDescription>
          </DialogHeader>
          {open && (
            <AssetTypeForm onSuccess={() => { setOpen(false); onCreated?.(); }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Rate Type Quick Create ---

function RateTypeForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(60);
  const queryClient = authClient.useQueryClient();

  const { mutate, isPending } = authClient.rates.createRateType.useMutation({
    onSuccess: () => {
      toast.success('Rate type created');
      queryClient.invalidateQueries({ queryKey: RATE_TYPES_QUERY_KEY });
      setName('');
      setMinutes(60);
      onSuccess();
    },
    onError: () => toast.error('Failed to create rate type'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim() || minutes < 1) return;
    mutate({ body: { name: name.trim(), minutes } });
  };

  const presets = [
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
    { label: '1 day', value: 1440 },
    { label: '1 week', value: 10080 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rate-type-name">Name</Label>
        <Input
          id="rate-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hourly, Daily, Weekly"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant={minutes === preset.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setMinutes(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value) || 1)}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground">{minutes} minutes per unit</p>
      </div>
      <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
        {isPending ? 'Creating...' : 'Create Rate Type'}
      </Button>
    </form>
  );
}

export function QuickCreateRateType({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <QuickCreateLink label="Create Rate Type" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Quick Create Rate Type</DialogTitle>
            <DialogDescription>Define a billing interval (e.g. Hourly, Daily).</DialogDescription>
          </DialogHeader>
          {open && (
            <RateTypeForm onSuccess={() => { setOpen(false); onCreated?.(); }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Customer Type Quick Create ---

function CustomerTypeForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const queryClient = authClient.useQueryClient();

  const { mutate, isPending } = authClient.customers.createCustomerType.useMutation({
    onSuccess: () => {
      toast.success('Customer type created');
      queryClient.invalidateQueries({ queryKey: ['customerTypes'] });
      setName('');
      onSuccess();
    },
    onError: () => toast.error('Failed to create customer type'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;
    mutate({ body: { name: name.trim() } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-type-name">Name</Label>
        <Input
          id="customer-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Individual, Corporate, VIP"
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
        {isPending ? 'Creating...' : 'Create Customer Type'}
      </Button>
    </form>
  );
}

export function QuickCreateCustomerType({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <QuickCreateLink label="Create Customer Type" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Quick Create Customer Type</DialogTitle>
            <DialogDescription>Add a new customer type category.</DialogDescription>
          </DialogHeader>
          {open && (
            <CustomerTypeForm onSuccess={() => { setOpen(false); onCreated?.(); }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Payment Method Quick Create ---

function PaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const queryClient = authClient.useQueryClient();

  const { mutate, isPending } = authClient.billing.createPaymentMethod.useMutation({
    onSuccess: () => {
      toast.success('Payment method created');
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      setName('');
      onSuccess();
    },
    onError: () => toast.error('Failed to create payment method'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;
    mutate({ body: { name: name.trim() } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-type-name">Name</Label>
        <Input
          id="customer-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Card, Cash, Bank Transfer"
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
        {isPending ? 'Creating...' : 'Create Payment Method'}
      </Button>
    </form>
  );
}

export function QuickCreatePaymentMethod({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <QuickCreateLink label="Create Payment Method" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Quick Create Payment Method</DialogTitle>
            <DialogDescription>Add a new payment method.</DialogDescription>
          </DialogHeader>
          {open && (
            <PaymentMethodForm onSuccess={() => { setOpen(false); onCreated?.(); }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
