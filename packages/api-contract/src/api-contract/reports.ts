import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

// Report response schemas
const ContactsSummarySchema = z.object({
  totalContacts: z.number(),
  newContactsThisMonth: z.number(),
  contactsWithCustomerProfile: z.number(),
  contactsWithOwnerProfile: z.number(),
  contactsBySource: z.array(z.object({
    source: z.string(),
    count: z.number()
  }))
});

const InquiriesByStatusSchema = z.object({
  totalInquiries: z.number(),
  inquiriesByStatus: z.array(z.object({
    status: z.enum(["New", "Follow-Up", "Closed"]),
    count: z.number()
  })),
  conversionRate: z.number(),
  averageResponseTime: z.number() // in hours
});

const CommunicationTrendsSchema = z.object({
  totalCommunications: z.number(),
  byType: z.array(z.object({
    type: z.enum(['Email', 'Phone Call', 'Meeting']),
    count: z.number()
  })),
  monthlyTrend: z.array(z.object({
    month: z.string(),
    count: z.number()
  }))
});

const FeedbackRatingsSchema = z.object({
  totalFeedback: z.number(),
  averageRating: z.number(),
  ratingDistribution: z.array(z.object({
    rating: z.number(),
    count: z.number()
  })),
  topRatedAssets: z.array(z.object({
    assetId: z.string(),
    assetName: z.string(),
    averageRating: z.number(),
    feedbackCount: z.number()
  }))
});

const TaskCompletionSchema = z.object({
  totalTasks: z.number(),
  completedTasks: z.number(),
  overdueTasks: z.number(),
  completionRate: z.number(),
  tasksByAssignee: z.array(z.object({
    assigneeId: z.string(),
    assigneeName: z.string(),
    totalTasks: z.number(),
    completedTasks: z.number()
  }))
});

const DateRangeQuery = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  period: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d')
});

export const reportsContract = c.router({
  getContactsSummary: {
    method: 'GET',
    path: '/reports/contacts/summary',
    summary: 'Get contacts summary report',
    query: DateRangeQuery,
    responses: {
      200: ContactsSummarySchema
    }
  },
  
  getInquiriesByStatus: {
    method: 'GET',
    path: '/reports/inquiries/status',
    summary: 'Get inquiries breakdown by status',
    query: DateRangeQuery.extend({
      assetId: z.string().optional(),
      assignedTo: z.string().optional()
    }),
    responses: {
      200: InquiriesByStatusSchema
    }
  },
  
  getCommunicationTrends: {
    method: 'GET',
    path: '/reports/communications/trends',
    summary: 'Get communication trends and patterns',
    query: DateRangeQuery.extend({
      contactId: z.string().optional(),
      userId: z.string().optional()
    }),
    responses: {
      200: CommunicationTrendsSchema
    }
  },
  
  getFeedbackRatings: {
    method: 'GET',
    path: '/reports/feedback/ratings',
    summary: 'Get feedback ratings analysis',
    query: DateRangeQuery.extend({
      assetId: z.string().optional(),
      minRating: z.coerce.number().min(1).max(5).optional()
    }),
    responses: {
      200: FeedbackRatingsSchema
    }
  },
  
  getTaskCompletion: {
    method: 'GET',
    path: '/reports/tasks/completion',
    summary: 'Get task completion rates and statistics',
    query: DateRangeQuery.extend({
      assignedTo: z.string().optional(),
      contactId: z.string().optional()
    }),
    responses: {
      200: TaskCompletionSchema
    }
  },
  
  getOverallDashboard: {
    method: 'GET',
    path: '/reports/dashboard',
    summary: 'Get overall CRM dashboard data',
    query: DateRangeQuery,
    responses: {
      200: z.object({
        contacts: ContactsSummarySchema,
        inquiries: InquiriesByStatusSchema,
        communications: CommunicationTrendsSchema,
        feedback: FeedbackRatingsSchema,
        tasks: TaskCompletionSchema
      })
    }
  }
});
