'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

type InvoiceSummary = {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
};

interface CreditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceSummary | null;
  onApplied: () => void;
}

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  reason: z.string().min(1, 'Reason is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreditNoteModal({ open, onOpenChange, invoice, onApplied }: CreditNoteModalProps) {
  const { data: creditNotesData, refetch: refetchCreditNotes } = authClient.billing.getCreditNotes.useQuery({
    queryKey: ['credit-notes', invoice?.id],
    queryData: { params: { id: invoice?.id ?? 0 } },
    enabled: !!invoice?.id && open,
  });

  const creditNotes = creditNotesData?.status === 200 ? creditNotesData.body : [];

  // Compute outstanding balance
  const totalCredited = creditNotes.reduce((sum, cn) => sum + parseFloat(cn.amount), 0);
  const totalAmount = parseFloat(invoice?.totalAmount ?? '0');
  // Outstanding = total - credited (payments are handled separately; this gives max credit available)
  const maxCredit = Math.max(0, totalAmount - totalCredited);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  });

  const watchedAmount = form.watch('amount') || 0;
  const afterCredit = Math.max(0, maxCredit - watchedAmount);

  // Pre-fill amount with outstanding balance when modal opens
  useEffect(() => {
    if (open && maxCredit > 0) {
      form.setValue('amount', parseFloat(maxCredit.toFixed(2)));
    }
  }, [open, maxCredit]);

  const { mutate: createCreditNote, isPending } = authClient.billing.createCreditNote.useMutation({
    onSuccess: () => {
      toast.success('Credit note issued successfully');
      form.reset();
      onOpenChange(false);
      onApplied();
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to issue credit note');
    },
  });

  const handleSubmit = (values: FormValues) => {
    if (!invoice) return;
    createCreditNote({
      params: { id: invoice.id },
      body: {
        amount: values.amount.toFixed(2),
        reason: values.reason,
      },
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset();
    onOpenChange(isOpen);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue Credit Note</DialogTitle>
          <DialogDescription>
            Invoice {invoice.invoiceNumber} — Total: ${parseFloat(invoice.totalAmount).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        {/* Existing credit notes */}
        {creditNotes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Existing Credit Notes</p>
            <div className="rounded border divide-y text-sm">
              {creditNotes.map((cn) => (
                <div key={cn.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="font-medium">{cn.creditNoteNumber}</span>
                    {cn.reason && <span className="text-muted-foreground ml-2">— {cn.reason}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">${parseFloat(cn.amount).toFixed(2)}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Available to credit: <span className="font-semibold">${maxCredit.toFixed(2)}</span>
            </p>
            <Separator />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={maxCredit}
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for credit note..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available outstanding</span>
                <span className="font-medium">${maxCredit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">This credit note</span>
                <span className="font-medium text-destructive">− ${(watchedAmount || 0).toFixed(2)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="font-medium">Remaining after credit</span>
                <span className="font-semibold">${afterCredit.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || maxCredit <= 0}>
                {isPending ? 'Issuing...' : 'Issue Credit Note'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
