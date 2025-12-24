import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from 'src/database-schema';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { and, eq, gte, lte, count, avg, sql } from 'drizzle-orm';


@Injectable()
export class ReportsService {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

  async getOverview(tenantId: string, query: { startDate?: string; endDate?: string; period?: string }) {
    const { startDate, endDate } = this.getDateRange(query.period, query.startDate, query.endDate);
    
    const [contacts, inquiries, communications, feedback, tasks] = await Promise.all([
      this.getContactsReport(tenantId, { startDate, endDate }),
      this.getInquiriesReport(tenantId, { startDate, endDate }),
      this.getCommunicationsReport(tenantId, { startDate, endDate }),
      this.getFeedbackReport(tenantId, { startDate, endDate }),
      this.getTasksReport(tenantId, { startDate, endDate })
    ]);

    return {
      contacts,
      inquiries,
      communications,
      feedback,
      tasks
    };
  }

  async getContactsReport(tenantId: string, query: { startDate?: string; endDate?: string; source?: "Website" | "Referral" | "Walk-In" | "Social" | "Other" }) {
    // const dateFilter = this.buildDateFilter(query.startDate, query.endDate, schema.Contact.createdAt);
    const sourceFilter = query.source ? eq(schema.Contact.source, query.source) : undefined;
    
    // Total contacts
    const totalContactsResult = await this.db
      .select({ count: count() })
      .from(schema.Contact)
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        // dateFilter,
        sourceFilter
      ));
    
    // New contacts this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const newContactsResult = await this.db
      .select({ count: count() })
      .from(schema.Contact)
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        gte(schema.Contact.createdAt, thisMonthStart),
        sourceFilter
      ));
    
    // Contacts with profiles
    const customersResult = await this.db
      .select({ count: count() })
      .from(schema.Contact)
      .innerJoin(schema.Customer, eq(schema.Contact.id, schema.Customer.contactId))
      .where(eq(schema.Contact.tenantId, tenantId));
    
    const ownersResult = await this.db
      .select({ count: count() })
      .from(schema.Contact)
      .innerJoin(schema.Owner, eq(schema.Contact.id, schema.Owner.contactId))
      .where(eq(schema.Contact.tenantId, tenantId));
    
    // Contacts by source
    const contactsBySourceResult = await this.db
      .select({
        source: schema.Contact.source,
        count: count()
      })
      .from(schema.Contact)
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        // dateFilter
      ))
      .groupBy(schema.Contact.source);
    
    return {
      totalContacts: totalContactsResult[0]?.count || 0,
      newContactsThisMonth: newContactsResult[0]?.count || 0,
      contactsWithCustomerProfile: customersResult[0]?.count || 0,
      contactsWithOwnerProfile: ownersResult[0]?.count || 0,
      contactsBySource: contactsBySourceResult.map(r => ({
        source: r.source,
        count: r.count
      }))
    };
  }

  async getInquiriesReport(tenantId: string, query: { startDate?: string; endDate?: string; status?: "New" | "Follow-Up" | "Closed"; assignedTo?: string; assetId?: string }) {
    // const dateFilter = this.buildDateFilter(query.startDate, query.endDate, schema.Inquiry.inquiryDate);
    const statusFilter = query.status ? eq(schema.Inquiry.status, query.status) : undefined;
    const assignedToFilter = query.assignedTo ? eq(schema.Inquiry.assignedTo, query.assignedTo) : undefined;
    const assetFilter = query.assetId ? eq(schema.Inquiry.assetId, query.assetId) : undefined;
    
    // Total inquiries
    const totalInquiriesResult = await this.db
      .select({ count: count() })
      .from(schema.Inquiry)
      .where(and(
        eq(schema.Inquiry.tenantId, tenantId),
        // dateFilter,
        statusFilter,
        assignedToFilter,
        assetFilter
      ));
    
    // Inquiries by status
    const inquiriesByStatusResult = await this.db
      .select({
        status: schema.Inquiry.status,
        count: count()
      })
      .from(schema.Inquiry)
      .where(and(
        eq(schema.Inquiry.tenantId, tenantId),
        // dateFilter,
        assignedToFilter,
        assetFilter
      ))
      .groupBy(schema.Inquiry.status);
    
    // Inquiries trend (last 12 months)
    const inquiriesTrendResult = await this.db
      .select({
        period: sql<string>`DATE_FORMAT(${schema.Inquiry.inquiryDate}, '%Y-%m')`,
        count: count()
      })
      .from(schema.Inquiry)
      .where(and(
        eq(schema.Inquiry.tenantId, tenantId),
        gte(schema.Inquiry.inquiryDate, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`),
        statusFilter,
        assignedToFilter,
        assetFilter
      ))
      .groupBy(sql`DATE_FORMAT(${schema.Inquiry.inquiryDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${schema.Inquiry.inquiryDate}, '%Y-%m')`);
    
    return {
      totalInquiries: totalInquiriesResult[0]?.count || 0,
      inquiriesByStatus: inquiriesByStatusResult.map(r => ({
        status: r.status as "New" | "Follow-Up" | "Closed",
        count: r.count
      })),
      inquiriesTrend: inquiriesTrendResult.map(r => ({
        period: r.period,
        count: r.count
      }))
    };
  }

  async getCommunicationsReport(tenantId: string, query: { startDate?: string; endDate?: string; type?: "Email" | "Phone Call" | "Meeting"; contactId?: string }) {
    // const dateFilter = this.buildDateFilter(query.startDate, query.endDate, schema.CommunicationLog.date);
    const typeFilter = query.type ? eq(schema.CommunicationLog.type, query.type) : undefined;
    const contactFilter = query.contactId ? eq(schema.CommunicationLog.contactId, BigInt(query.contactId)) : undefined;
    
    // Total communications
    const totalCommunicationsResult = await this.db
      .select({ count: count() })
      .from(schema.CommunicationLog)
      .innerJoin(schema.Contact, eq(schema.CommunicationLog.contactId, schema.Contact.id))
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        // dateFilter,
        typeFilter,
        contactFilter
      ));
    
    // Communications by type
    const communicationsByTypeResult = await this.db
      .select({
        type: schema.CommunicationLog.type,
        count: count()
      })
      .from(schema.CommunicationLog)
      .innerJoin(schema.Contact, eq(schema.CommunicationLog.contactId, schema.Contact.id))
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        // dateFilter,
        contactFilter
      ))
      .groupBy(schema.CommunicationLog.type);
    
    // Communications trend
    const communicationsTrendResult = await this.db
      .select({
        period: sql<string>`DATE_FORMAT(${schema.CommunicationLog.date}, '%Y-%m')`,
        count: count()
      })
      .from(schema.CommunicationLog)
      .innerJoin(schema.Contact, eq(schema.CommunicationLog.contactId, schema.Contact.id))
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        gte(schema.CommunicationLog.date, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`),
        typeFilter,
        contactFilter
      ))
      .groupBy(sql`DATE_FORMAT(${schema.CommunicationLog.date}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${schema.CommunicationLog.date}, '%Y-%m')`);
    
    return {
      totalCommunications: totalCommunicationsResult[0]?.count || 0,
      communicationsByType: communicationsByTypeResult.map(r => ({
        type: r.type as 'Email' | 'Phone Call' | 'Meeting',
        count: r.count
      })),
      communicationsTrend: communicationsTrendResult.map(r => ({
        period: r.period,
        count: r.count
      }))
    };
  }

  async getFeedbackReport(tenantId: string, query: { startDate?: string; endDate?: string; assetId?: string; minRating?: number; maxRating?: number }) {
    // const dateFilter = this.buildDateFilter(query.startDate, query.endDate, schema.Feedback.viewingDate);
    const assetFilter = query.assetId ? eq(schema.Feedback.assetId, query.assetId) : undefined;
    const ratingFilter = and(
      query.minRating ? gte(schema.Feedback.rating, query.minRating) : undefined,
      query.maxRating ? lte(schema.Feedback.rating, query.maxRating) : undefined
    );
    
    // Total feedback and average rating
    const feedbackStatsResult = await this.db
      .select({
        count: count(),
        avgRating: avg(schema.Feedback.rating)
      })
      .from(schema.Feedback)
      .innerJoin(schema.Contact, eq(schema.Feedback.contactId, schema.Contact.id))
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        // dateFilter,
        assetFilter,
        ratingFilter
      ));
    
    // Rating distribution
    const ratingDistributionResult = await this.db
      .select({
        rating: schema.Feedback.rating,
        count: count()
      })
      .from(schema.Feedback)
      .innerJoin(schema.Contact, eq(schema.Feedback.contactId, schema.Contact.id))
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        // dateFilter,
        assetFilter
      ))
      .groupBy(schema.Feedback.rating)
      .orderBy(schema.Feedback.rating);
    
    // Feedback trend
    const feedbackTrendResult = await this.db
      .select({
        period: sql<string>`DATE_FORMAT(${schema.Feedback.viewingDate}, '%Y-%m')`,
        averageRating: avg(schema.Feedback.rating),
        count: count()
      })
      .from(schema.Feedback)
      .innerJoin(schema.Contact, eq(schema.Feedback.contactId, schema.Contact.id))
      .where(and(
        eq(schema.Contact.tenantId, tenantId),
        gte(schema.Feedback.viewingDate, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`),
        assetFilter
      ))
      .groupBy(sql`DATE_FORMAT(${schema.Feedback.viewingDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${schema.Feedback.viewingDate}, '%Y-%m')`);
    
    return {
      totalFeedback: feedbackStatsResult[0]?.count || 0,
      averageRating: Number(feedbackStatsResult[0]?.avgRating || 0),
      ratingDistribution: ratingDistributionResult.map(r => ({
        rating: r.rating,
        count: r.count
      })),
      feedbackTrend: feedbackTrendResult.map(r => ({
        period: r.period,
        averageRating: Number(r.averageRating || 0),
        count: r.count
      }))
    };
  }

  async getTasksReport(tenantId: string, query: { startDate?: string; endDate?: string; assignedTo?: string; completed?: boolean }) {
    // const dateFilter = this.buildDateFilter(query.startDate, query.endDate, schema.Task.dueDate);
    const assignedToFilter = query.assignedTo ? eq(schema.Task.userId, query.assignedTo) : undefined;
    const completedFilter = query.completed !== undefined 
      ? eq(schema.Task.status, query.completed ? 'Completed' : 'Pending') 
      : undefined;
    
    // Total and completed tasks
    const totalTasksResult = await this.db
      .select({ count: count() })
      .from(schema.Task)
      .where(and(
        eq(schema.Task.tenantId, tenantId),
        // dateFilter,
        assignedToFilter
      ));
    
    const completedTasksResult = await this.db
      .select({ count: count() })
      .from(schema.Task)
      .where(and(
        eq(schema.Task.tenantId, tenantId),
        eq(schema.Task.status, 'Completed'),
        // dateFilter,
        assignedToFilter
      ));
    
    // Overdue tasks
    const overdueTasksResult = await this.db
      .select({ count: count() })
      .from(schema.Task)
      .where(and(
        eq(schema.Task.tenantId, tenantId),
        eq(schema.Task.status, 'Overdue'),
        assignedToFilter
      ));
    
    // Tasks by assignee
    const tasksByAssigneeResult = await this.db
      .select({
        assigneeId: schema.Task.userId,
        assigneeName: sql<string>`CONCAT(${schema.User.name})`,
        totalTasks: count(),
        completedTasks: sql<number>`SUM(CASE WHEN ${schema.Task.status} = 'Completed' THEN 1 ELSE 0 END)`
      })
      .from(schema.Task)
      .innerJoin(schema.User, eq(schema.Task.userId, schema.User.id))
      .where(
        eq(schema.Task.tenantId, tenantId)
        // dateFilter
      )
      .groupBy(schema.Task.userId, schema.User.name);
    
    return {
      totalTasks: totalTasksResult[0]?.count || 0,
      completedTasks: completedTasksResult[0]?.count || 0,
      overdueTasks: overdueTasksResult[0]?.count || 0,
      tasksByAssignee: tasksByAssigneeResult.map(r => ({
        assigneeId: r.assigneeId,
        assigneeName: r.assigneeName,
        totalTasks: r.totalTasks,
        completedTasks: Number(r.completedTasks)
      }))
    };
  }

  private getDateRange(period?: string, startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return { startDate, endDate };
    }
    
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case '30d':
      default:
        start.setDate(start.getDate() - 30);
        break;
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  // private buildDateFilter<T extends Record<string, any>>(
  //   startDate?: string, 
  //   endDate?: string, 
  //   dateColumn?: MySqlDateColumn
  // ) {
  //   if (!startDate && !endDate) return undefined;
    
  //   const conditions = [];
  //   if (startDate) {
  //     conditions.push(gte(dateColumn, startDate));
  //   }
  //   if (endDate) {
  //     conditions.push(lte(dateColumn, endDate));
  //   }
    
  //   return conditions.length > 1 ? and(...conditions) : conditions[0];
  // }
}