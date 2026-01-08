// lib/feature-permissions.ts

export const FEATURE_PERMISSIONS = {
  // BOOKINGS
  bookings_assets: ['assets:read', 'assets:write'], 
//   bookings_rates: ['users:write'],
//   bookings_availability: ['users:read'],

  // REPORTS
  reports: ['reports:read'],

  // INVOICES / BILLING
  invoices: ['billing:read'],

  // ANALYTICS
  analytics: ['analytics:read'],

  // SETTINGS
  settings: ['settings:read'],
} as const;

export type FeatureKey = keyof typeof FEATURE_PERMISSIONS;
