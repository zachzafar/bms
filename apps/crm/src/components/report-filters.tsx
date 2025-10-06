"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter } from "lucide-react"


const ReportFiltersSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assetId: z.string().optional(),
  assignedTo: z.string().optional(),
  contactId: z.string().optional(),
})

export type ReportFiltersInputs = z.infer<typeof ReportFiltersSchema>

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFiltersInputs) => void
  initialFilters?: Partial<ReportFiltersInputs>
  showAssetFilter?: boolean
  showAssigneeFilter?: boolean
  showContactFilter?: boolean
}

export function ReportFilters({ 
  onFiltersChange, 
  initialFilters = {}, 
  showAssetFilter = false,
  showAssigneeFilter = false,
  showContactFilter = false
}: ReportFiltersProps) {
  const form = useForm<ReportFiltersInputs>({
    resolver: zodResolver(ReportFiltersSchema),
    defaultValues: {
      period: '30d',
      ...initialFilters
    }
  })

  const watchPeriod = form.watch('period')
  const isCustomPeriod = watchPeriod === 'custom'

  const onSubmit = (data: ReportFiltersInputs) => {
    // Auto-calculate dates for non-custom periods
    if (data.period !== 'custom') {
      const now = new Date()
      const daysMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }
      const days = daysMap[data.period as keyof typeof daysMap]
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
      
      data.startDate = startDate.toISOString().split('T')[0]
      data.endDate = now.toISOString().split('T')[0]
    }
    
    onFiltersChange(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCustomPeriod && (
                <>
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {showAssetFilter && (
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All assets" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All assets</SelectItem>
                          {/* Add asset options here */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showAssigneeFilter && (
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All users" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All users</SelectItem>
                          {/* Add user options here */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showContactFilter && (
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All contacts" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All contacts</SelectItem>
                          {/* Add contact options here */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Apply Filters
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}