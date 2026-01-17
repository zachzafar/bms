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
    redirect('/bookings/dashboard')
  } else {
    // User is not authenticated, redirect to auth app
    redirect('/login')
  }
}