"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, TrendingDown, Users, Home, MessageSquare, Download, DollarSign, Star, CheckCircle } from "lucide-react"
import { authClient } from "@/lib/api/publicClient"
import { 
  REPORTS_DASHBOARD_QUERY_KEY,
  REPORTS_CONTACTS_SUMMARY_QUERY_KEY,
  REPORTS_INQUIRIES_STATUS_QUERY_KEY,
  REPORTS_COMMUNICATION_TRENDS_QUERY_KEY,
  REPORTS_FEEDBACK_RATINGS_QUERY_KEY,
  REPORTS_TASK_COMPLETION_QUERY_KEY
} from "@/lib/api/queryKeys"
import { ReportFilters, ReportFiltersInputs } from "@/components/crm/report-filters"


const chartConfig = {
  contacts: {
    label: "Contacts",
    color: "hsl(var(--chart-1))",
  },
  inquiries: {
    label: "Inquiries",
    color: "hsl(var(--chart-2))",
  },
  communications: {
    label: "Communications",
    color: "hsl(var(--chart-3))",
  },
  feedback: {
    label: "Feedback",
    color: "hsl(var(--chart-4))",
  },
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsDashboard() {
  const [filters, setFilters] = useState<ReportFiltersInputs>({
    period: '30d'
  })

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = authClient.reports.getOverallDashboard.useQuery({
    queryKey: REPORTS_DASHBOARD_QUERY_KEY,

  })

  const dashboard = dashboardData?.body

  const handleFiltersChange = (newFilters: ReportFiltersInputs) => {
    setFilters(newFilters)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">CRM Reports</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <ReportFilters 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
        showAssetFilter
        showAssigneeFilter
        showContactFilter
      />

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.contacts.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboard?.contacts.newContactsThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.inquiries.totalInquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.inquiries.conversionRate || 0}% conversion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Feedback Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.feedback.averageRating || 0}</div>
            <p className="text-xs text-muted-foreground">
              From {dashboard?.feedback.totalFeedback || 0} reviews
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.tasks.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.tasks.completedTasks || 0} of {dashboard?.tasks.totalTasks || 0} tasks
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Communication Trends</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.communications.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke={chartConfig.communications.color}
                        fill={chartConfig.communications.color}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Inquiry Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard?.inquiries.inquiriesByStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(dashboard?.inquiries.inquiriesByStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contacts by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard?.contacts.contactsBySource || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill={chartConfig.contacts.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>With Customer Profile</span>
                  <Badge variant="secondary">
                    {dashboard?.contacts.contactsWithCustomerProfile || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>With Owner Profile</span>
                  <Badge variant="secondary">
                    {dashboard?.contacts.contactsWithOwnerProfile || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>New This Month</span>
                  <Badge variant="outline">
                    {dashboard?.contacts.newContactsThisMonth || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard?.feedback.ratingDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill={chartConfig.feedback.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(dashboard?.feedback.topRatedAssets || []).map((asset, index) => (
                    <div key={asset.assetId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{asset.assetName}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.feedbackCount} reviews
                        </p>
                      </div>
                      <Badge variant="outline">
                        ⭐ {asset.averageRating}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Add more tab contents for other sections */}
      </Tabs>
    </div>
  )
}
