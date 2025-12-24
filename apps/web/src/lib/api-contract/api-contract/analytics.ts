import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const analyticsContract = c.router({
    // Asset analytics
    getAssetCount: {
        method: 'GET',
        path: '/analytics/assets/summary',
        responses: {
            200: z.object({
                totalAssets: z.number(),
                byAssetType: z.array(z.object({
                    assetTypeId: z.number(),
                    count: z.number()
                }))
            })
        },
        query: z.object({
            assetTypeId: z.array(z.number()).optional()
        }),
        summary: 'Get asset count analytics'
    },
    
    getAssetUtilization: {
        method: 'GET',
        path: '/analytics/assets/utilization',
        responses: {
            200: z.array(z.object({
                assetType: z.string(),
                utilizationRate: z.number(),
                booked: z.number(),
                total: z.number()
            }))
        },
        query: z.object({
            period: z.string()
        }),
        summary: 'Get asset utilization rates'
    },
    
    // Booking analytics
    getBookingCount: {
        method: 'GET',
        path: '/analytics/bookings/counts',
        responses: {
            200: z.object({
                totalBookings: z.number(),
            })
        },
        summary: 'Get booking count analytics'
    },

    getBookingCountsByMonthPerYear: {
        method: 'GET',
        path: '/analytics/bookings/counts/monthly',
        responses: {
            200: z.object({
                total: z.number(),
                monthly: z.array(z.object({
                month: z.string(),
                bookings: z.number()
                }))
            })
        },
        query: z.object({
            year: z.string()
        }),
    },
    
    getBookingTrends: {
        method: 'GET',
        path: '/analytics/bookings/trends',
        responses: {
            200: z.array(z.object({
                period: z.string(),
                count: z.number()
            }))
        },
        query: z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            groupBy: z.enum(['day', 'week', 'month', 'year']).default('month'),
            assetTypeId: z.string().optional()
        }),
        summary: 'Get booking trend analytics'
    },
    
    // Customer analytics
    getCustomerAnalytics: {
        method: 'GET',
        path: '/analytics/customers/summary',
        responses: {
            200: z.object({
                totalCustomers: z.number(),
                newCustomers: z.object({
                    lastWeek: z.number(),
                    lastMonth: z.number(),
                    lastYear: z.number()
                }),
                topCustomers: z.array(z.object({
                    customerId: z.string(),
                    customerName: z.string(),
                    bookingsCount: z.number()
                })).optional()
            })
        },
        query: z.object({
            includeTopCustomers: z.boolean().optional().default(false),
            topCustomersLimit: z.number().optional().default(5)
        }),
        summary: 'Get customer analytics'
    },
    
    // Revenue analytics
    getRevenueByAssetTypePerYear: {
        method: 'GET',
        path: '/analytics/revenue',
        responses: {
            200: z.array(z.object({
                assetType: z.string(),
                revenue: z.number()
            }))
        },
        query: z.object({
            period: z.string()
        }),
        summary: 'Get revenue analytics'
    },

    getMaintenanceCostByAssetTypePerMonth: {
        method: 'GET',
        path: '/analytics/maintenance/cost',
        responses: {
            200: z.array(z.object({
                assetType: z.string(),
                month: z.string(),
                totalCost: z.number()
            }))
        },
        query: z.object({
            period: z.string()
        })
    }
})