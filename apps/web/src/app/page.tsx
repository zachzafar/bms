import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Users, Building2, Search, CreditCard, BarChart, Settings, Shield, Boxes } from 'lucide-react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function LandingPage() {
  // Check if user is authenticated
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  
  if (session) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard')
  } else {
    // User is not authenticated, redirect to auth app
    const authUrl = process.env.NODE_ENV === 'production' 
      ? 'https://bookos.xyz'
      : 'http://localhost:3002'
    
    redirect(authUrl)
  }
}

// export default function LandingPage() {
//   return (
//     <>
//       <main className="flex-grow">
//         {/* Hero Section */}
//         <section className="bg-gradient-to-b from-white to-gray-50 border-b">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
//             <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
//               <span className="block">The Complete Platform for</span>
//               <span className="block text-primary">Asset Booking Management</span>
//             </h1>
//             <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
//               Streamline your rental business with our comprehensive booking management system. 
//               Perfect for equipment rentals, venue bookings, and more.
//             </p>
//             <div className="mt-10 flex justify-center gap-4">
//               <Button size="lg" asChild>
//                 <Link href="/signup">Get Started</Link>
//               </Button>
//               <Button size="lg" variant="outline" asChild>
//                 <Link href="/contact">Contact Sales</Link>
//               </Button>
//             </div>
//           </div>
//         </section>

//         {/* Features Grid */}
//         <section className="py-20">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center mb-16">
//               <h2 className="text-3xl font-bold">Everything You Need to Manage Bookings</h2>
//               <p className="mt-4 text-lg text-muted-foreground">
//                 Powerful features for every user role in your organization
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//               {features.map((feature) => (
//                 <div
//                   key={feature.title}
//                   className="relative p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
//                 >
//                   <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
//                     <feature.icon className="w-6 h-6 text-primary" />
//                   </div>
//                   <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
//                   <p className="text-muted-foreground">{feature.description}</p>
//                   <ul className="mt-4 space-y-2">
//                     {feature.capabilities.map((capability) => (
//                       <li key={capability} className="flex items-start">
//                         <svg
//                           className="h-5 w-5 text-primary shrink-0"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                           stroke="currentColor"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M5 13l4 4L19 7"
//                           />
//                         </svg>
//                         <span className="ml-2 text-sm">{capability}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* CTA Section */}
//         <section className="bg-primary text-primary-foreground">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
//             <div className="text-center">
//             <h2 className="text-3xl font-bold">Ready to Transform Your Booking Operations?</h2>
//             <p className="mt-4 text-lg opacity-90">
//               Join thousands of businesses that trust BookingOS for their asset management needs
//             </p>
//             <div className="mt-8">
//               <Button 
//                 size="lg" 
//                 variant="secondary"
//                 asChild
//               >
//                 <Link href="/signup">Start Your Free Trial</Link>
//               </Button>
//             </div>
//           </div>
//         </section>
//       </main>
//     </>
//   )
// }

// const features = [
//   {
//     title: 'Internal Staff Tools',
//     description: 'Powerful tools for your team to manage assets and bookings efficiently.',
//     icon: Users,
//     capabilities: [
//       'Asset management with custom labels',
//       'Maintenance record tracking',
//       'Bulk asset uploads',
//       'Real-time availability tracking',
//     ],
//   },
//   {
//     title: 'Customer Experience',
//     description: 'Seamless booking experience for your customers.',
//     icon: Search,
//     capabilities: [
//       'Advanced search filters',
//       'Online booking portal',
//       'Multiple payment methods',
//       'Wishlist functionality',
//     ],
//   },
//   {
//     title: 'Tenant Administration',
//     description: 'Complete control over your booking operations.',
//     icon: Building2,
//     capabilities: [
//       'Detailed analytics & reports',
//       'Staff access management',
//       'Custom terms & conditions',
//       'Regional tax configuration',
//     ],
//   },
//   {
//     title: 'System Management',
//     description: 'Enterprise-grade platform management.',
//     icon: Settings,
//     capabilities: [
//       'Usage metrics monitoring',
//       'Selective update rollouts',
//       'Security alerts',
//       'Performance monitoring',
//     ],
//   },
// ]

