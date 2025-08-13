// 'use client';

// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { useRouter } from 'next/navigation';
// import { authClient } from '@/lib/api/publicClient';

// export default function InvoicesPage() {
//   const router = useRouter();
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchInvoices = async () => {
//       try {
//         const response = await authClient.billing.getInvoices.query({});
//         if (response.status === 200) {
//           setInvoices(response.body);
//         }
//       } catch (error) {
//         console.error('Error fetching invoices:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInvoices();
//   }, []);

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case 'paid':
//         return <Badge className="bg-green-500">Paid</Badge>;
//       case 'partially_paid':
//         return <Badge className="bg-yellow-500">Partially Paid</Badge>;
//       case 'pending':
//         return <Badge className="bg-blue-500">Pending</Badge>;
//       case 'overdue':
//         return <Badge className="bg-red-500">Overdue</Badge>;
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
//         <h1 className="text-3xl font-bold">Invoices</h1>
//         <Button onClick={() => router.push('/billing/invoices/create')}>
//           Create Invoice
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>All Invoices</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <p>Loading invoices...</p>
//           ) : invoices.length === 0 ? (
//             <p>No invoices found.</p>
//           ) : (
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Invoice #</TableHead>
//                   <TableHead>Customer</TableHead>
//                   <TableHead>Issue Date</TableHead>
//                   <TableHead>Due Date</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {invoices.map((invoice) => (
//                   <TableRow key={invoice.id}>
//                     <TableCell>{invoice.invoiceNumber}</TableCell>
//                     <TableCell>{invoice.customerId}</TableCell>
//                     <TableCell>{formatDate(invoice.issueDate)}</TableCell>
//                     <TableCell>{formatDate(invoice.dueDate)}</TableCell>
//                     <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
//                     <TableCell>{getStatusBadge(invoice.status)}</TableCell>
//                     <TableCell>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
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