// 'use client';

// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { useRouter } from 'next/navigation';
// import { authClient } from '@/lib/api/publicClient';

// export default function PaymentsPage() {
//   const router = useRouter();
//   const [payments, setPayments] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchPayments = async () => {
//       try {
//         const response = await authClient.billing.getPayments.query({});
//         if (response.status === 200) {
//           setPayments(response.body);
//         }
//       } catch (error) {
//         console.error('Error fetching payments:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPayments();
//   }, []);

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case 'completed':
//         return <Badge className="bg-green-500">Completed</Badge>;
//       case 'pending':
//         return <Badge className="bg-blue-500">Pending</Badge>;
//       case 'failed':
//         return <Badge className="bg-red-500">Failed</Badge>;
//       default:
//         return <Badge>{status}</Badge>;
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString();
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//     }).format(amount);
//   };

//   return (
//     <div className="container mx-auto py-10">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Payments</h1>
//         <Button onClick={() => router.push('/billing/payments/create')}>
//           Record Payment
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>All Payments</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <p>Loading payments...</p>
//           ) : payments.length === 0 ? (
//             <p>No payments found.</p>
//           ) : (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Payment ID</TableHead>
//                   <TableHead>Customer</TableHead>
//                   <TableHead>Date</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Type</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {payments.map((payment) => (
//                   <TableRow key={payment.id}>
//                     <TableCell>{payment.id}</TableCell>
//                     <TableCell>{payment.customerId}</TableCell>
//                     <TableCell>{formatDate(payment.paymentDate)}</TableCell>
//                     <TableCell>{formatCurrency(payment.amount)}</TableCell>
//                     <TableCell>{payment.type}</TableCell>
//                     <TableCell>{getStatusBadge(payment.status)}</TableCell>
//                     <TableCell>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => router.push(`/billing/payments/${payment.id}`)}
//                       >
//                         View
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }