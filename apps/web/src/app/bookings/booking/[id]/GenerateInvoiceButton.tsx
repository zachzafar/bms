// 'use client';

// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/components/ui/use-toast';
// import { authClient } from '@/lib/api/publicClient';
// import { useRouter } from 'next/navigation';

// interface GenerateInvoiceButtonProps {
//   bookingId: string;
// }

// export default function GenerateInvoiceButton({ bookingId }: GenerateInvoiceButtonProps) {
//   const [loading, setLoading] = useState(false);
//   const { toast } = useToast();
//   const router = useRouter();

//   const handleGenerateInvoice = async () => {
//     setLoading(true);
//     try {
//       const response = await authClient.billing.generateInvoiceFromBooking.mutate({
//         params: { bookingId },
//         body: {},
//       });

//       if (response.status === 201) {
//         toast({
//           title: 'Success',
//           description: 'Invoice generated successfully',
//         });
//         router.push(`/billing/invoices/${response.body.invoiceId}`);
//       }
//     } catch (error) {
//       console.error('Error generating invoice:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to generate invoice',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Button onClick={handleGenerateInvoice} disabled={loading}>
//       {loading ? 'Generating...' : 'Generate Invoice'}
//     </Button>
//   );
// }